<?php

namespace App\Controller;

use App\Repository\ActionLogRepository;
use App\Repository\MembreRepository;
use App\Repository\TransactionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/dashboard')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class DashboardController extends AbstractController
{
    public function __construct(
        private MembreRepository $membreRepo,
        private TransactionRepository $transactionRepo,
        private ActionLogRepository $logRepo,
        private EntityManagerInterface $em
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $annee = (int) date('Y');
        $mois  = (int) date('m');

        // --- MEMBRES ---
        $totalMembres    = $this->membreRepo->count([]);
        $membresActifs   = $this->membreRepo->count(['statut' => 'actif']);
        $membresMinistre = $this->membreRepo->count(['estMinistre' => true]);

        // --- TRANSACTIONS DU MOIS ---
        $debutMois = new \DateTime(date('Y-m-01'));
        $finMois   = (clone $debutMois)->modify('last day of this month');

        $txMois = $this->transactionRepo->createQueryBuilder('t')
            ->andWhere('t.date BETWEEN :debut AND :fin')
            ->setParameter('debut', $debutMois)
            ->setParameter('fin', $finMois)
            ->getQuery()->getResult();

        $entreesMois = 0;
        $sortiesMois = 0;
        foreach ($txMois as $t) {
            $t->getType() === 'entree'
                ? $entreesMois += (float) $t->getMontant()
                : $sortiesMois += (float) $t->getMontant();
        }

        // --- SOLDES ANNEE EN COURS ---
        $txAnnee = $this->transactionRepo->createQueryBuilder('t')
            ->andWhere('t.exercice = :annee')
            ->setParameter('annee', $annee)
            ->getQuery()->getResult();

        $soldeBanque  = 0;
        $soldeEspeces = 0;
        foreach ($txAnnee as $t) {
            $montant   = (float) $t->getMontant();
            $isBanque  = $t->getModePaiement() === 'banque';
            $isEntree  = $t->getType() === 'entree';
            $signe     = $isEntree ? 1 : -1;

            $isBanque
                ? $soldeBanque  += $signe * $montant
                : $soldeEspeces += $signe * $montant;
        }

        // --- ACTIVITE RECENTE ---
        $logsRecents = $this->logRepo->createQueryBuilder('l')
            ->leftJoin('l.utilisateur', 'u')
            ->addSelect('u')
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults(5)
            ->getQuery()->getResult();

        $activite = array_map(fn($l) => [
            'action'      => $l->getAction(),
            'module'      => $l->getModule(),
            'entiteId'    => $l->getEntiteId(),
            'utilisateur' => $l->getUtilisateur()
                ? $l->getUtilisateur()->getPrenom().' '.$l->getUtilisateur()->getNom()
                : 'Système',
            'createdAt'   => $l->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $logsRecents);

        return $this->json([
            'membres' => [
                'total'     => $totalMembres,
                'actifs'    => $membresActifs,
                'ministres' => $membresMinistre,
            ],
            'comptabilite' => [
                'solde_banque'   => $soldeBanque,
                'solde_especes'  => $soldeEspeces,
                'solde_global'   => $soldeBanque + $soldeEspeces,
                'entrees_mois'   => $entreesMois,
                'sorties_mois'   => $sortiesMois,
                'balance_mois'   => $entreesMois - $sortiesMois,
            ],
            'transactions' => [
                'total_annee' => count($txAnnee),
                'total_mois'  => count($txMois),
            ],
            'activite_recente' => $activite,
            'periode' => [
                'mois' => $mois,
                'annee' => $annee,
            ],
        ]);
    }
}
