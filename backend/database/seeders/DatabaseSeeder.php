<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Competence;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@plateforme.test'],
            [
                'nom' => 'Administrateur',
                'prenom' => 'Plateforme',
                'password' => Hash::make('Admin12345'),
                'role' => Role::ADMIN->value,
            ]
        );

        foreach (['PHP', 'Laravel', 'Angular', 'JavaScript', 'MySQL', 'HTML/CSS', 'Git', 'Python'] as $nom) {
            Competence::firstOrCreate(['nom_competence' => $nom]);
        }
    }
}
