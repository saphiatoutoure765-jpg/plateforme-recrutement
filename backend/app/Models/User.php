<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['nom', 'prenom', 'email', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['role' => Role::class];

    public function candidat(): HasOne
    {
        return $this->hasOne(Candidat::class);
    }

    public function entreprise(): HasOne
    {
        return $this->hasOne(Entreprise::class);
    }
}
