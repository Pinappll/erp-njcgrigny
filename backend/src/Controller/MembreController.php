<?php

namespace App\Controller;

use App\Entity\Membre;
use App\Repository\MembreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/membres')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class MembreController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MembreRepository $membreRepository
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->membreRepository->createQueryBuilder('m');

        // Recherche texte
        if ($search = $request->query->get('search')) {
            $qb->andWhere('m.nom LIKE :s OR m.prenom LIKE :s OR m.telephone LIKE :s OR m.groupe LIKE :s')
               ->setParameter('s', '%' . $search . '%');
        }

        // Filtre statut
        if ($statut = $request->query->get('statut')) {
            $qb->andWhere('m.statut = :statut')->setParameter('statut', $statut);
        }

        // Filtre ministre
        if ($request->query->has('estMinistre')) {
            $qb->andWhere('m.estMinistre = :ministre')
               ->setParameter('ministre', filter_var($request->query->get('estMinistre'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filtre KOG
        if ($request->query->has('estMembreKog')) {
            $qb->andWhere('m.estMembreKog = :kog')
               ->setParameter('kog', filter_var($request->query->get('estMembreKog'), FILTER_VALIDATE_BOOLEAN));
        }

        $membres = $qb->orderBy('m.nom', 'ASC')->getQuery()->getResult();
        return $this->json(array_map(fn(Membre $m) => $this->serialize($m), $membres));
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Membre $membre): JsonResponse
    {
        return $this->json($this->serialize($membre));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $membre = new Membre();
        $this->hydrate($membre, $data);
        $this->em->persist($membre);
        $this->em->flush();
        return $this->json($this->serialize($membre), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(Membre $membre, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->hydrate($membre, $data);
        $this->em->flush();
        return $this->json($this->serialize($membre));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Membre $membre): JsonResponse
    {
        $this->em->remove($membre);
        $this->em->flush();
        return $this->json(['message' => 'Membre supprimé']);
    }

    #[Route('/export/csv', methods: ['GET'])]
    public function exportCsv(): \Symfony\Component\HttpFoundation\Response
    {
        $membres = $this->membreRepository->findAll();
        $csv = "id,nom,prenom,sexe,telephone,email,statut,groupe,estMinistre,estMembreKog,dateArrivee\n";
        foreach ($membres as $m) {
            $csv .= implode(',', [
                $m->getId(), $m->getNom(), $m->getPrenom(), $m->getSexe(),
                $m->getTelephone(), $m->getEmail(), $m->getStatut(),
                $m->getGroupe(), $m->isEstMinistre() ? '1' : '0',
                $m->isEstMembreKog() ? '1' : '0',
                $m->getDateArrivee()?->format('Y-m-d') ?? ''
            ]) . "\n";
        }

        return new \Symfony\Component\HttpFoundation\Response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="membres.csv"',
        ]);
    }

    private function hydrate(Membre $membre, array $data): void
    {
        if (isset($data['nom'])) $membre->setNom($data['nom']);
        if (isset($data['prenom'])) $membre->setPrenom($data['prenom']);
        if (isset($data['sexe'])) $membre->setSexe($data['sexe']);
        if (isset($data['telephone'])) $membre->setTelephone($data['telephone']);
        if (isset($data['email'])) $membre->setEmail($data['email']);
        if (isset($data['adresse'])) $membre->setAdresse($data['adresse']);
        if (isset($data['photo'])) $membre->setPhoto($data['photo']);
        if (isset($data['statut'])) $membre->setStatut($data['statut']);
        if (isset($data['groupe'])) $membre->setGroupe($data['groupe']);
        if (isset($data['estMinistre'])) $membre->setEstMinistre($data['estMinistre']);
        if (isset($data['estMembreKog'])) $membre->setEstMembreKog($data['estMembreKog']);
        if (isset($data['dateNaissance'])) $membre->setDateNaissance(new \DateTime($data['dateNaissance']));
        if (isset($data['dateBapteme'])) $membre->setDateBapteme(new \DateTime($data['dateBapteme']));
        if (isset($data['dateArrivee'])) $membre->setDateArrivee(new \DateTime($data['dateArrivee']));
    }

    private function serialize(Membre $m): array
    {
        return [
            'id' => $m->getId(),
            'nom' => $m->getNom(),
            'prenom' => $m->getPrenom(),
            'sexe' => $m->getSexe(),
            'dateNaissance' => $m->getDateNaissance()?->format('Y-m-d'),
            'telephone' => $m->getTelephone(),
            'email' => $m->getEmail(),
            'photo' => $m->getPhoto(),
            'adresse' => $m->getAdresse(),
            'statut' => $m->getStatut(),
            'groupe' => $m->getGroupe(),
            'estMinistre' => $m->isEstMinistre(),
            'estMembreKog' => $m->isEstMembreKog(),
            'dateBapteme' => $m->getDateBapteme()?->format('Y-m-d'),
            'dateArrivee' => $m->getDateArrivee()?->format('Y-m-d'),
        ];
    }
}
