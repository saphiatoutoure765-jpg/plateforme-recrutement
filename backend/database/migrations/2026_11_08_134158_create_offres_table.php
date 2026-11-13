<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entreprise_id')->constrained('entreprises')->cascadeOnDelete();
            $table->string('titre', 150);
            $table->unsignedInteger('experience_requise')->default(0);
            $table->enum('type_contrat', ['CDI', 'CDD', 'Stage', 'Freelance']);
            $table->dateTime('date_publication')->useCurrent();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offres');
    }
};
