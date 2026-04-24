<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints formations : routes publiques et routes protégées formateur
class FormationControllerTest extends TestCase
{
    use RefreshDatabase;

    // Profils utilisés pour simuler l'authentification via le middleware
    private array $profilFormateur = ['id' => 1, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
    private array $profilApprenant = ['id' => 2, 'nom' => 'Bob', 'email' => 'bob@test.com', 'role' => 'apprenant'];

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('log')->andReturn(null);
        });
    }

    private function simulerConnexion(array $profil): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $profil], 200),
        ]);
    }

    public function test_list_formations_public(): void
    {
        Formation::factory()->count(3)->create();
        $reponse = $this->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(3);
    }

    public function test_show_formation_increments_views(): void
    {
        $formation = Formation::factory()->create(['vues' => 0]);
        $this->getJson("/api/formations/{$formation->id}")->assertOk();
        $this->assertDatabaseHas('formations', ['id' => $formation->id, 'vues' => 1]);
    }

    public function test_show_formation_returns_data(): void
    {
        $formation = Formation::factory()->create(['titre' => 'Cours de test']);
        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonPath('titre', 'Cours de test');
    }

    public function test_create_formation_as_trainer(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $donneesFormation = [
            'titre'       => 'Formation Laravel',
            'description' => 'Apprenez Laravel de zéro',
            'category'    => 'dev',
            'date'        => '2026-09-01',
            'price'       => 150,
            'duration'    => 20,
            'level'       => 'beginner',
        ];

        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', $donneesFormation);
        $reponse->assertCreated()->assertJsonPath('titre', 'Formation Laravel');
        $this->assertDatabaseHas('formations', ['titre' => 'Formation Laravel']);
    }

    public function test_create_formation_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', []);
        $reponse->assertForbidden();
    }

    public function test_update_own_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $donneesMaj = [
            'titre'       => 'Titre mis à jour',
            'description' => 'Description mise à jour',
            'category'    => 'design',
            'date'        => '2026-10-01',
        ];

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$formation->id}", $donneesMaj);
        $reponse->assertOk()->assertJsonPath('titre', 'Titre mis à jour');
    }

    public function test_update_other_formation_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$formationAutre->id}", [
            'titre'       => 'Tentative',
            'description' => 'x',
            'category'    => 'dev',
            'date'        => '2026-01-01',
        ]);

        $reponse->assertForbidden();
    }

    public function test_delete_own_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('formations', ['id' => $formation->id]);
    }

    public function test_delete_other_formation_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formationAutre->id}");
        $reponse->assertForbidden();
    }

    public function test_my_formations_returns_only_own(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->count(2)->create(['user_id' => 1]);
        Formation::factory()->count(3)->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertOk()->assertJsonCount(2);
    }

    public function test_my_formations_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertForbidden();
    }

    public function test_no_token_returns_401(): void
    {
        $reponse = $this->postJson('/api/formations', []);
        $reponse->assertUnauthorized();
    }
}
