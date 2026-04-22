<?php

namespace App\DataFixtures;

use App\Entity\Categorie;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $hasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // Admin
        $admin = new User();
        $admin->setEmail('admin@njcgrigny.fr');
        $admin->setNom('Admin');
        $admin->setPrenom('Super');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setActif(true);
        $admin->setDateCreation(new \DateTime());
        $admin->setPassword($this->hasher->hashPassword($admin, 'Admin1234!'));
        $manager->persist($admin);

        // Catégories entrées
        $entreesData = [
            ['Dîmes',        'entree', '#22c55e'],
            ['Offrandes',    'entree', '#16a34a'],
            ['Box anonyme',  'entree', '#86efac'],
            ['Dépôt espèce', 'entree', '#4ade80'],
            ['Autre entrée', 'entree', '#bbf7d0'],
        ];

        // Catégories sorties
        $sortiesData = [
            ['Loyer',            'sortie', '#ef4444'],
            ['Frais bancaires',  'sortie', '#dc2626'],
            ['Visiting Pastor',  'sortie', '#f87171'],
            ['Cafétéria',        'sortie', '#fca5a5'],
            ['Dîme UEE',         'sortie', '#b91c1c'],
            ['Général',          'sortie', '#f97316'],
            ['Autre sortie',     'sortie', '#fdba74'],
        ];

        foreach (array_merge($entreesData, $sortiesData) as [$nom, $type, $couleur]) {
            $cat = new Categorie();
            $cat->setNom($nom);
            $cat->setType($type);
            $cat->setCouleur($couleur);
            $cat->setActif(true);
            $manager->persist($cat);
        }

        $manager->flush();
    }
}
