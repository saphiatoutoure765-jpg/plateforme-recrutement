<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Competence extends Model
{
    protected $fillable = ['nom_competence'];

    public function candidats(): BelongsToMany
    {
        return $this->belongsToMany(Candidat::class, 'candidat_competence');
    }

    public function offres(): BelongsToMany
    {
        return $this->belongsToMany(Offre::class, 'offre_competence');
    }
}
