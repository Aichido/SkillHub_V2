<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('utilisateur_id');  // id du service Auth
            $table->unsignedBigInteger('formation_id');    // id du service Catalog
            $table->integer('progression')->default(0);
            $table->timestamp('date_inscription')->nullable();
            $table->timestamps();

            $table->unique(['utilisateur_id', 'formation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
