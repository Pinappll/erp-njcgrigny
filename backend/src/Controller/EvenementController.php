<?php

namespace App\Controller;

use App\Entity\Evenement;
use App\Repository\EvenementRepository;
use App\Service\ActionLoggerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/evenements')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class EvenementController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private EvenementRepository $repo,
        private ActionLoggerService $logger
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->repo->createQueryBuilder('e')
            ->leftJoin('e.creePar', 'u')
            ->addSelect('u');

        if ($type = $request->query->get('type')) {
            $qb->andWhere('e.type = :type')->setParameter('type', $type);
        }

        if ($mois = $request->query->get('mois')) {
            $annee = $request->query->get('annee', date('Y'));
            $debut = new \DateTime($annee . '-' . str_pad($mois, 2, '0', STR_PAD_LEFT) . '-01');
            $fin   = (clone $debut)->modify('last day of this month');
            $qb->andWhere('e.dateDebut BETWEEN :debut AND :fin')
               ->setParameter('debut', $debut)
               ->setParameter('fin', $fin);
        }

        if ($annee = $request->query->get('annee')) {
            $qb->andWhere('YEAR(e.dateDebut) = :annee')
               ->setParameter('annee', (int) $annee);
        }

        $evenements = $qb->orderBy('e.dateDebut', 'ASC')->getQuery()->getResult();

        return $this->json(array_map(fn($e) => $this->serialize($e), $evenements));
    }

    #[Route('/upcoming', methods: ['GET'])]
    public function upcoming(): JsonResponse
    {
        $evenements = $this->repo->createQueryBuilder('e')
            ->andWhere('e.dateDebut >= :now')
            ->setParameter('now', new \DateTime())
            ->orderBy('e.dateDebut', 'ASC')
            ->setMaxResults(5)
            ->getQuery()->getResult();

        return $this->json(array_map(fn($e) => $this->serialize($e), $evenements));
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Evenement $evenement): JsonResponse
    {
        return $this->json($this->serialize($evenement));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $evenement = new Evenement();
        $this->hydrate($evenement, $data);
        $evenement->setCreePar($this->getUser());

        $this->em->persist($evenement);
        $this->em->flush();

        $this->logger->log('CREATE', 'Evenement', $evenement->getId(), [
            'titre' => $evenement->getTitre(),
            'type'  => $evenement->getType(),
            'date'  => $evenement->getDateDebut()->format('Y-m-d H:i'),
        ], $this->getUser());

        return $this->json($this->serialize($evenement), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(Evenement $evenement, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->hydrate($evenement, $data);
        $this->em->flush();

        $this->logger->log('UPDATE', 'Evenement', $evenement->getId(), [
            'titre' => $evenement->getTitre(),
            'type'  => $evenement->getType(),
            'date'  => $evenement->getDateDebut()->format('Y-m-d H:i'),
        ], $this->getUser());

        return $this->json($this->serialize($evenement));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Evenement $evenement): JsonResponse
    {
        $this->logger->log('DELETE', 'Evenement', $evenement->getId(), [
            'titre' => $evenement->getTitre(),
        ], $this->getUser());

        $this->em->remove($evenement);
        $this->em->flush();
        return $this->json(['message' => 'Événement supprimé']);
    }

    private function hydrate(Evenement $e, array $data): void
    {
        if (isset($data['titre']))       $e->setTitre($data['titre']);
        if (isset($data['description'])) $e->setDescription($data['description']);
        if (isset($data['dateDebut']))   $e->setDateDebut(new \DateTime($data['dateDebut']));
        if (isset($data['dateFin']))     $e->setDateFin(new \DateTime($data['dateFin']));
        if (isset($data['lieu']))        $e->setLieu($data['lieu']);
        if (isset($data['type']))        $e->setType($data['type']);
    }

    private function serialize(Evenement $e): array
    {
        return [
            'id'          => $e->getId(),
            'titre'       => $e->getTitre(),
            'description' => $e->getDescription(),
            'dateDebut'   => $e->getDateDebut()->format('Y-m-d H:i'),
            'dateFin'     => $e->getDateFin()?->format('Y-m-d H:i'),
            'lieu'        => $e->getLieu(),
            'type'        => $e->getType(),
            'creePar'     => $e->getCreePar()
                ? $e->getCreePar()->getPrenom().' '.$e->getCreePar()->getNom()
                : null,
            'createdAt'   => $e->getCreatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}
