<?php

namespace App\Enums;

enum Role: string
{
    case ADMIN = 'admin';
    case CANDIDAT = 'candidat';
    case ENTREPRISE = 'entreprise';
}
