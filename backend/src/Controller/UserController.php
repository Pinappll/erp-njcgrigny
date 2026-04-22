<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
        private UserRepository $userRepository
    ) {}

    // Liste tous les utilisateurs
    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        $data = array_map(fn(User $u) => $this->serialize($u), $users);
        return $this->json($data);
    }

    // Détail d'un utilisateur
    #[Route('/{id}', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        return $this->json($this->serialize($user));
    }

    // Créer un utilisateur
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);
        $user->setPrenom($data['prenom']);
        $user->setRoles([$data['role'] ?? 'ROLE_USER']);
        $user->setActif($data['actif'] ?? true);
        $user->setDateCreation(new \DateTime());
        $user->setPassword(
            $this->hasher->hashPassword($user, $data['password'])
        );

        $this->em->persist($user);
        $this->em->flush();

        return $this->json($this->serialize($user), 201);
    }

    // Modifier un utilisateur
    #[Route('/{id}', methods: ['PUT'])]
    public function update(User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['email'])) $user->setEmail($data['email']);
        if (isset($data['nom'])) $user->setNom($data['nom']);
        if (isset($data['prenom'])) $user->setPrenom($data['prenom']);
        if (isset($data['role'])) $user->setRoles([$data['role']]);
        if (isset($data['actif'])) $user->setActif($data['actif']);
        if (isset($data['password'])) {
            $user->setPassword(
                $this->hasher->hashPassword($user, $data['password'])
            );
        }

        $this->em->flush();
        return $this->json($this->serialize($user));
    }

    // Supprimer un utilisateur
    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(User $user): JsonResponse
    {
        $this->em->remove($user);
        $this->em->flush();
        return $this->json(['message' => 'Utilisateur supprimé']);
    }

    // Activer/désactiver
    #[Route('/{id}/toggle', methods: ['PATCH'])]
    public function toggle(User $user): JsonResponse
    {
        $user->setActif(!$user->isActif());
        $this->em->flush();
        return $this->json($this->serialize($user));
    }

    private function serialize(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'roles' => $user->getRoles(),
            'actif' => $user->isActif(),
            'dateCreation' => $user->getDateCreation()?->format('Y-m-d H:i:s'),
            'avatar' => $user->getAvatar(),
        ];
    }
}
