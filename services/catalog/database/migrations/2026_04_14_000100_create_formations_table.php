<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formations', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description');
            $table->string('category', 100);
            $table->date('date');
            $table->string('statut', 60)->default('À venir');
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('duration')->default(1);
            $table->string('level', 30)->default('beginner');
            $table->unsignedBigInteger('vues')->default(0);
            $table->unsignedBigInteger('user_id');          // id du formateur (service Auth)
            $table->string('formateur_nom')->nullable();     // nom dénormalisé
            $table->unsignedInteger('apprenants_count')->default(0); // mis à jour par service Enrollment
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formations');
    }
};
