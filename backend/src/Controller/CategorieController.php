<?php

namespace App\Controller;

use App\Entity\Categorie;
use App\Repository\CategorieRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/categories')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class CategorieController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CategorieRepository $repo
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->repo->createQueryBuilder('c')->where('c.actif = true');

        if ($type = $request->query->get('type')) {
            $qb->andWhere('c.type = :type')->setParameter('type', $type);
        }

        return $this->json(array_map(
            fn(Categorie $c) => $this->serialize($c),
            $qb->orderBy('c.type', 'ASC')->addOrderBy('c.nom', 'ASC')->getQuery()->getResult()
        ));
    }

    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $cat = new Categorie();
        $cat->setNom($data['nom']);
        $cat->setType($data['type']); // 'entree' ou 'sortie'
        $cat->setCouleur($data['couleur'] ?? null);
        $cat->setActif($data['actif'] ?? true);
        $this->em->persist($cat);
        $this->em->flush();
        return $this->json($this->serialize($cat), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(Categorie $cat, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['nom'])) $cat->setNom($data['nom']);
        if (isset($data['type'])) $cat->setType($data['type']);
        if (isset($data['couleur'])) $cat->setCouleur($data['couleur']);
        if (isset($data['actif'])) $cat->setActif($data['actif']);
        $this->em->flush();
        return $this->json($this->serialize($cat));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Categorie $cat): JsonResponse
    {
        // Désactive au lieu de supprimer pour préserver l'historique
        $cat->setActif(false);
        $this->em->flush();
        return $this->json(['message' => 'Catégorie désactivée']);
    }

    private function serialize(Categorie $c): array
    {
        return [
            'id' => $c->getId(),
            'nom' => $c->getNom(),
            'type' => $c->getType(),
            'couleur' => $c->getCouleur(),
            'actif' => $c->isActif(),
        ];
    }
}
