<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints inscription : seuls les apprenants peuvent s'inscrire à une formation
class EnrollmentControllerTest extends TestCase
{
    use RefreshDatabase;

    // Les identifiants formation sont fictifs et validés via le service Catalog mocké
    private array $profilApprenant  = ['id' => 1, 'nom' => 'Bob', 'email' => 'bob@test.com', 'role' => 'apprenant'];
    private array $profilFormateur  = ['id' => 2, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
    private int   $idFormation      = 42;

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

    private function simulerFormationDisponible(): void
    {
        Http::fake([
            '*/api/validate-token'              => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response(['id' => $this->idFormation, 'titre' => 'PHP avancé'], 200),
        ]);
    }

    public function test_learner_can_enroll(): void
    {
        $this->simulerFormationDisponible();

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertCreated()->assertJsonPath('formation_id', $this->idFormation);
        $this->assertDatabaseHas('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_duplicate_enrollment_returns_same(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");

        $reponse->assertCreated();
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_trainer_cannot_enroll(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertForbidden();
    }

    public function test_enroll_not_found_returns_404(): void
    {
        Http::fake([
            '*/api/validate-token'              => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response([], 404),
        ]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertNotFound();
    }

    public function test_learner_can_unenroll(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        Enrollment::factory()->create([
            'utilisateur_id' => 1,
            'formation_id'   => $this->idFormation,
        ]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertOk();
        $this->assertDatabaseMissing('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_trainer_cannot_unenroll(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertForbidden();
    }

    public function test_learner_sees_enrollments(): void
    {
        Http::fake([
            '*/api/validate-token'   => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/*'     => Http::response(['id' => 10, 'titre' => 'Formation test', 'description' => '', 'category' => 'dev', 'date' => null, 'statut' => '', 'price' => 0, 'duration' => 0, 'level' => '', 'vues' => 0, 'apprenants' => 0, 'formateur' => null, 'modules' => []], 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 10]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertOk()->assertJsonCount(1);
    }

    public function test_learner_no_enrollment_returns_empty(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertOk()->assertJson([]);
    }

    public function test_trainer_cannot_view_enrollments(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertForbidden();
    }

    public function test_no_token_returns_401(): void
    {
        $reponse = $this->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertUnauthorized();
    }
    public function test_learner_cannot_enroll_more_than_five_formations(): void
    {
        // 1. Simuler la connexion et la disponibilité d'une nouvelle formation
        $this->simulerFormationDisponible();

        // 2. Créer 5 inscriptions existantes pour cet utilisateur (ID 1 selon votre profilApprenant)
        Enrollment::factory()->count(5)->create([
            'utilisateur_id' => $this->profilApprenant['id']
        ]);

        // 3. Tenter une 6ème inscription
        $reponse = $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription");

        // 4. Vérifier que la requête est rejetée (400) avec le bon message
        $reponse->assertStatus(400)
            ->assertJson([
                'code' => 'MAXIMUM_ENROLLMENTS_REACHED',
                'message' => 'Vous avez atteint le nombre maximum de 5 inscriptions actives. Veuillez terminer ou abandonner une formation avant d\'en commencer une nouvelle.'
            ]);

        // 5. Vérifier qu'aucune 6ème inscription n'a été ajoutée en base
        $this->assertDatabaseCount('enrollments', 5);
    }
}
