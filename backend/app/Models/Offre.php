<?php

namespace App\Models;

use App\Enums\TypeContrat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offre extends Model
{
    protected $fillable = [
        'entreprise_id', 'titre', 'experience_requise',
        'type_contrat', 'date_publication', 'actif',
    ];

    protected $casts = [
        'experience_requise' => 'integer',
        'type_contrat' => TypeContrat::class,
        'actif' => 'boolean',
        'date_publication' => 'datetime',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(Competence::class, 'offre_competence');
    }

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class);
    }
}
