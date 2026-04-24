<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints modules : ajout, modification et suppression par le formateur propriétaire
class ModuleControllerTest extends TestCase
{
    use RefreshDatabase;

    // Le formateur doit posséder la formation pour gérer ses modules
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

    public function test_list_modules(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->count(3)->create(['formation_id' => $formation->id]);

        $reponse = $this->getJson("/api/formations/{$formation->id}/modules");
        $reponse->assertOk()->assertJsonCount(3);
    }

    public function test_add_module_as_owner(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $donneesModule = ['titre' => 'Introduction', 'contenu' => 'Contenu de présentation'];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $donneesModule);
        $reponse->assertCreated()->assertJsonPath('titre', 'Introduction');
        $this->assertDatabaseHas('modules', ['titre' => 'Introduction', 'formation_id' => $formation->id]);
    }

    public function test_add_module_other_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formationAutre->id}/modules", [
            'titre'   => 'Tentative',
            'contenu' => 'Contenu non autorisé',
        ]);

        $reponse->assertForbidden();
    }

    public function test_add_module_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", [
            'titre'   => 'Tentative',
            'contenu' => 'x',
        ]);

        $reponse->assertForbidden();
    }

    public function test_update_own_module(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module    = Module::factory()->create(['formation_id' => $formation->id]);

        $donneesMaj = ['titre' => 'Titre modifié', 'contenu' => 'Nouveau contenu', 'ordre' => 2];

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", $donneesMaj);
        $reponse->assertOk()->assertJsonPath('titre', 'Titre modifié');
    }

    public function test_update_other_module_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);
        $module         = Module::factory()->create(['formation_id' => $formationAutre->id]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", [
            'titre'   => 'Hack',
            'contenu' => 'x',
            'ordre'   => 1,
        ]);

        $reponse->assertForbidden();
    }

    public function test_delete_own_module(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module    = Module::factory()->create(['formation_id' => $formation->id]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/modules/{$module->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    public function test_delete_other_module_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);
        $module         = Module::factory()->create(['formation_id' => $formationAutre->id]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/modules/{$module->id}");
        $reponse->assertForbidden();
    }
}
