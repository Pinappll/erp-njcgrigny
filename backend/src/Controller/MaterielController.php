<?php

namespace App\Controller;

use App\Entity\Materiel;
use App\Repository\MaterielRepository;
use App\Service\ActionLoggerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/inventaire')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class MaterielController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MaterielRepository $repo,
        private ActionLoggerService $logger
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->repo->createQueryBuilder('m');

        if ($etat = $request->query->get('etat')) {
            $qb->andWhere('m.etat = :etat')->setParameter('etat', $etat);
        }

        if ($categorie = $request->query->get('categorie')) {
            $qb->andWhere('m.categorie = :categorie')->setParameter('categorie', $categorie);
        }

        if ($search = $request->query->get('search')) {
            $qb->andWhere('m.nom LIKE :s OR m.description LIKE :s OR m.localisation LIKE :s')
               ->setParameter('s', '%'.$search.'%');
        }

        $materiels = $qb->orderBy('m.nom', 'ASC')->getQuery()->getResult();

        return $this->json(array_map(fn($m) => $this->serialize($m), $materiels));
    }

    #[Route('/alertes', methods: ['GET'])]
    public function alertes(): JsonResponse
    {
        $materiels = $this->repo->createQueryBuilder('m')
            ->andWhere('m.etat IN (:etats)')
            ->setParameter('etats', ['mauvais', 'hors_service'])
            ->orderBy('m.etat', 'DESC')
            ->getQuery()->getResult();

        return $this->json([
            'total'    => count($materiels),
            'materiels' => array_map(fn($m) => $this->serialize($m), $materiels),
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Materiel $materiel): JsonResponse
    {
        return $this->json($this->serialize($materiel));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $materiel = new Materiel();
        $this->hydrate($materiel, $data);

        $this->em->persist($materiel);
        $this->em->flush();

        $this->logger->log('CREATE', 'Materiel', $materiel->getId(), [
            'nom'       => $materiel->getNom(),
            'categorie' => $materiel->getCategorie(),
            'etat'      => $materiel->getEtat(),
        ], $this->getUser());

        return $this->json($this->serialize($materiel), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(Materiel $materiel, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->hydrate($materiel, $data);
        $materiel->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->logger->log('UPDATE', 'Materiel', $materiel->getId(), [
            'nom'  => $materiel->getNom(),
            'etat' => $materiel->getEtat(),
        ], $this->getUser());

        return $this->json($this->serialize($materiel));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Materiel $materiel): JsonResponse
    {
        $this->logger->log('DELETE', 'Materiel', $materiel->getId(), [
            'nom' => $materiel->getNom(),
        ], $this->getUser());

        $this->em->remove($materiel);
        $this->em->flush();
        return $this->json(['message' => 'Matériel supprimé']);
    }

    private function hydrate(Materiel $m, array $data): void
    {
        if (isset($data['nom']))          $m->setNom($data['nom']);
        if (isset($data['description']))  $m->setDescription($data['description']);
        if (isset($data['categorie']))    $m->setCategorie($data['categorie']);
        if (isset($data['etat']))         $m->setEtat($data['etat']);
        if (isset($data['quantite']))     $m->setQuantite((int) $data['quantite']);
        if (isset($data['localisation'])) $m->setLocalisation($data['localisation']);
        if (isset($data['dateAchat']))    $m->setDateAchat(new \DateTime($data['dateAchat']));
        if (isset($data['valeurAchat']))  $m->setValeurAchat($data['valeurAchat']);
        if (isset($data['notes']))        $m->setNotes($data['notes']);
        if (array_key_exists('facturePj', $data)) $m->setFacturePj($data['facturePj']);
    }

    private function serialize(Materiel $m): array
    {
        return [
            'id'          => $m->getId(),
            'nom'         => $m->getNom(),
            'description' => $m->getDescription(),
            'categorie'   => $m->getCategorie(),
            'etat'        => $m->getEtat(),
            'quantite'    => $m->getQuantite(),
            'localisation'=> $m->getLocalisation(),
            'dateAchat'   => $m->getDateAchat()?->format('Y-m-d'),
            'valeurAchat' => $m->getValeurAchat() ? (float) $m->getValeurAchat() : null,
            'notes'       => $m->getNotes(),
            'facturePj'   => $m->getFacturePj(),
            'createdAt'   => $m->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt'   => $m->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}
