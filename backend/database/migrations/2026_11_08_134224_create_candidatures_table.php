<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidat_id')->constrained('candidats')->cascadeOnDelete();
            $table->foreignId('offre_id')->constrained('offres')->cascadeOnDelete();
            $table->decimal('score_compatibilite', 5, 2)->default(0);
            $table->dateTime('date_candidature')->useCurrent();
            $table->enum('statut', ['en attente', 'acceptee', 'refusee'])->default('en attente');
            $table->timestamps();
            $table->unique(['candidat_id', 'offre_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidatures');
    }
};
