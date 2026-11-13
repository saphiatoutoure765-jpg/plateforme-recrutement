<?php

namespace App\Models;

use App\Enums\StatutCandidature;
use App\Services\ScoreService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidature extends Model
{
    protected $fillable = [
        'candidat_id', 'offre_id', 'score_compatibilite',
        'date_candidature', 'statut',
    ];

    protected $casts = [
        'score_compatibilite' => 'float',
        'date_candidature' => 'datetime',
        'statut' => StatutCandidature::class,
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class);
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class);
    }

    public function calculerScore(): float
    {
        return ScoreService::calculer($this->candidat, $this->offre);
    }
}
