<?php

namespace App\DataFixtures;

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
        $admin = new User();
        $admin->setEmail('admin@njcgrigny.fr');
        $admin->setNom('Admin');
        $admin->setPrenom('Super');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setActif(true);
        $admin->setDateCreation(new \DateTime());
        $admin->setPassword(
            $this->hasher->hashPassword($admin, 'Admin1234!')
        );

        $manager->persist($admin);
        $manager->flush();
    }
}
