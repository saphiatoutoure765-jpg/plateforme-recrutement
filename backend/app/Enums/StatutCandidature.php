<?php

namespace App\Enums;

enum StatutCandidature: string
{
    case EN_ATTENTE = 'en attente';
    case ACCEPTEE = 'acceptee';
    case REFUSEE = 'refusee';
}
