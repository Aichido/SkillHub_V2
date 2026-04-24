<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // CONFIGURATION DE LA SÉCURITÉ POUR LES TESTS
    // ==========================================

    protected function setUp(): void
    {
        parent::setUp();
        putenv('APP_MASTER_KEY=CleDeTestSecrete123!');
    }

    private function chiffrerPourTest(string $motDePasseClair): string
    {
        $cle = hash('sha256', env('APP_MASTER_KEY'), true);
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-gcm'));
        $tag = "";
        $ciphertext = openssl_encrypt($motDePasseClair, 'aes-256-gcm', $cle, OPENSSL_RAW_DATA, $iv, $tag);
        return base64_encode($iv) . ':' . base64_encode($ciphertext) . ':' . base64_encode($tag);
    }

    private function genererEntetesSecurite(array $donnees = [], int $decalageTemps = 0, bool $mauvaiseSignature = false): array
    {
        $payload = json_encode($donnees);
        $nonce = uniqid('test_', true);
        $timestamp = time() + $decalageTemps;
        $masterKey = env('APP_MASTER_KEY');

        $signature = hash_hmac('sha256', $payload . $nonce . $timestamp, $masterKey);

        if ($mauvaiseSignature) {
            $signature = hash_hmac('sha256', 'payload_modifié', $masterKey);
        }

        return [
            'X-Nonce' => $nonce,
            'X-Timestamp' => $timestamp,
            'X-HMAC-Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    private function genererJetonPourTest(User $user): string
    {
        return app(\App\Services\ServiceJwt::class)->generer([
            'sub'   => $user->id,
            'email' => $user->email,
            'role'  => $user->role,
            'exp'   => time() + 3600
        ]);
    }

    // ==========================================
    // 1. TESTS INSCRIPTION (VALIDATION STRICTE)
    // ==========================================

    public function test_inscription_reussie_avec_donnees_valides(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(201)->assertJsonStructure(['token']);
    }

    public function test_inscription_echoue_email_deja_pris(): void
    {
        User::factory()->create(['email' => 'jean@example.com']);
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_inscription_echoue_email_invalide(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'pas-un-email', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_inscription_echoue_mot_de_passe_trop_court(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Ab1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_inscription_echoue_mot_de_passe_sans_caractere_special(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Password123', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_inscription_echoue_role_inconnu(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'hacker'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['role']);
    }

    // ==========================================
    // 2. TESTS SÉCURITÉ ANTI-REJEU & HMAC (TP3)
    // ==========================================

    public function test_requete_bloquee_si_entetes_securite_manquants(): void
    {
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'Password1!'];
        $response = $this->postJson('/api/login', $donnees);
        $response->assertStatus(403)->assertJson(['message' => 'Paramètres de sécurité manquants.']);
    }

    public function test_requete_bloquee_si_timestamp_expire(): void
    {
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'Password1!'];
        $entetes = $this->genererEntetesSecurite($donnees, -600);
        $response = $this->postJson('/api/login', $donnees, $entetes);
        $response->assertStatus(403)->assertJson(['message' => 'Requête expirée.']);
    }

    public function test_requete_bloquee_si_signature_falsifiee(): void
    {
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'Password1!'];
        $entetes = $this->genererEntetesSecurite($donnees, 0, true);
        $response = $this->postJson('/api/login', $donnees, $entetes);
        $response->assertStatus(403)->assertJson(['message' => 'Signature invalide.']);
    }

    public function test_requete_bloquee_si_tentative_de_rejeu(): void
    {
        $donnees = ['nom' => 'Test', 'email' => 'test@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $entetes = $this->genererEntetesSecurite($donnees);

        $this->postJson('/api/register', $donnees, $entetes)->assertStatus(201);
        $rejeu = $this->postJson('/api/register', $donnees, $entetes);

        $rejeu->assertStatus(403)->assertJson(['message' => 'Tentative de rejeu détectée.']);
    }

    // ==========================================
    // 3. TESTS CONNEXION
    // ==========================================

    public function test_connexion_reussie_avec_identifiants_valides(): void
    {
        User::factory()->create(['email' => 'jean@example.com', 'password' => $this->chiffrerPourTest('Password1!')]);
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'Password1!'];
        $response = $this->postJson('/api/login', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_connexion_echoue_mauvais_mot_de_passe(): void
    {
        User::factory()->create(['email' => 'jean@example.com', 'password' => $this->chiffrerPourTest('Password1!')]);
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'MauvaisPass1!'];
        $response = $this->postJson('/api/login', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(401);
    }

    public function test_connexion_echoue_email_inexistant(): void
    {
        $donnees = ['email' => 'fantome@example.com', 'mot_de_passe' => 'Password1!'];
        $response = $this->postJson('/api/login', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(401);
    }

    // ==========================================
    // 4. TESTS JWT & PROFIL
    // ==========================================

    public function test_acces_profil_reussi_avec_token_valide(): void
    {
        $user = User::factory()->create(['password' => $this->chiffrerPourTest('Password1!')]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->getJson('/api/profil');
        $response->assertStatus(200)->assertJson(['email' => $user->email]);
    }

    public function test_acces_profil_refuse_sans_token(): void
    {
        $response = $this->getJson('/api/profil');
        $response->assertStatus(401);
    }

    public function test_deconnexion_reussie_et_blacklist(): void
    {
        $user = User::factory()->create();
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->postJson('/api/logout');
        $response->assertStatus(200)->assertJson(['message' => 'Déconnexion effectuée.']);

        $cleBlacklist = 'jwt_blacklist:'.hash('sha256', $jeton);
        $this->assertTrue(Cache::has($cleBlacklist));
    }

    // ==========================================
    // 5. TESTS CHANGEMENT DE MOT DE PASSE (TP5)
    // ==========================================

    public function test_changement_mot_de_passe_reussi(): void
    {
        $user = User::factory()->create(['password' => $this->chiffrerPourTest('AncienPass1!')]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->putJson('/api/change-password', [
            'ancien_mot_de_passe'  => 'AncienPass1!',
            'nouveau_mot_de_passe' => 'NouveauPass2@',
        ]);
        $response->assertStatus(200);

        // Vérification que le password a bien changé et est au format AES-GCM (iv:ciphertext:tag)
        $user->refresh();
        $this->assertNotEmpty($user->password);
        $this->assertStringContainsString(':', $user->password);
        $parties = explode(':', $user->password);
        $this->assertCount(3, $parties);
    }

    public function test_changement_mot_de_passe_echoue_si_ancien_incorrect(): void
    {
        $user = User::factory()->create(['password' => $this->chiffrerPourTest('AncienPass1!')]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->putJson('/api/change-password', [
            'ancien_mot_de_passe'  => 'MauvaisAncien1!',
            'nouveau_mot_de_passe' => 'NouveauPass2@',
        ]);
        $response->assertStatus(403);
    }

    public function test_changement_mot_de_passe_echoue_si_nouveau_identique_ancien(): void
    {
        $user = User::factory()->create(['password' => $this->chiffrerPourTest('AncienPass1!')]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->putJson('/api/change-password', [
            'ancien_mot_de_passe'  => 'AncienPass1!',
            'nouveau_mot_de_passe' => 'AncienPass1!',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nouveau_mot_de_passe']);
    }

    public function test_changement_mot_de_passe_echoue_si_nouveau_trop_faible(): void
    {
        $user = User::factory()->create(['password' => $this->chiffrerPourTest('AncienPass1!')]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->putJson('/api/change-password', [
            'ancien_mot_de_passe'  => 'AncienPass1!',
            'nouveau_mot_de_passe' => 'faible',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['nouveau_mot_de_passe']);
    }

    // ==========================================
    // 6. TESTS VALIDATION INTERNE MICROSERVICES
    // ==========================================

    public function test_validation_interne_reussie_avec_token_valide(): void
    {
        $user = User::factory()->create();
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->postJson('/api/validate-token');
        $response->assertStatus(200)->assertJson(['valid' => true])->assertJsonStructure(['user' => ['id', 'nom', 'email', 'role']]);
    }

    public function test_validation_interne_echoue_si_token_blacklist(): void
    {
        $user = User::factory()->create();
        $jeton = $this->genererJetonPourTest($user);

        Cache::put('jwt_blacklist:'.hash('sha256', $jeton), true, 3600);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->postJson('/api/validate-token');
        $response->assertStatus(401)->assertJson(['valid' => false, 'message' => 'Jeton blacklisté.']);
    }

    public function test_validation_interne_echoue_sans_token(): void
    {
        $response = $this->postJson('/api/validate-token');
        $response->assertStatus(401)->assertJson(['valid' => false, 'message' => 'Jeton manquant.']);
    }
}