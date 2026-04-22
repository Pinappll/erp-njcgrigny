<?php

namespace App\Controller;

use App\Entity\Transaction;
use App\Repository\TransactionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use App\Service\ActionLoggerService;


#[Route('/api/transactions')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class TransactionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private TransactionRepository $repo,
        private ActionLoggerService $logger
    ) {}

    // Liste avec filtres + calcul des soldes
    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->repo->createQueryBuilder('t')
            ->leftJoin('t.saisirPar', 'u')
            ->addSelect('u');

        // Filtre par mois/année
        if ($mois = $request->query->get('mois')) {
            $anneeFilter = $request->query->get('annee', date('Y'));
            $debut = new \DateTime($anneeFilter . '-' . str_pad($mois, 2, '0', STR_PAD_LEFT) . '-01');
            $fin = (clone $debut)->modify('last day of this month');
            $qb->andWhere('t.date BETWEEN :debut AND :fin')
            ->setParameter('debut', $debut)
            ->setParameter('fin', $fin);
        }
        if ($annee = $request->query->get('annee')) {
            $qb->andWhere('t.exercice = :exercice')->setParameter('exercice', (int) $annee);
        } else {
            $qb->andWhere('t.exercice = :exercice')
            ->setParameter('exercice', (int) date('Y'));
        }

        if ($type = $request->query->get('type')) {
            $qb->andWhere('t.type = :type')->setParameter('type', $type);
        }

        if ($categorie = $request->query->get('categorie')) {
            $qb->andWhere('t.categorie = :cat')->setParameter('cat', $categorie);
        }

        if ($mode = $request->query->get('modePaiement')) {
            $qb->andWhere('t.modePaiement = :mode')->setParameter('mode', $mode);
        }

        if ($membreId = $request->query->get('membreId')) {
            $qb->andWhere('t.membre = :membre')->setParameter('membre', $membreId);
        }

        $transactions = $qb->orderBy('t.date', 'ASC')->getQuery()->getResult();

        // Calcul des soldes
        $soldes = $this->calculerSoldes($transactions);

        return $this->json([
            'transactions' => array_map(fn($t) => $this->serialize($t), $transactions),
            'soldes' => $soldes,
        ]);
    }

    // Rapport mensuel (comme ton onglet SUMMARY)
    #[Route('/rapport', methods: ['GET'])]
    public function rapport(Request $request): JsonResponse
    {
        $annee = $request->query->get('annee', date('Y'));

        $transactions = $this->repo->createQueryBuilder('t')
            ->andWhere('t.exercice = :annee')
            ->setParameter('annee', (int) $annee)
            ->orderBy('t.date', 'ASC')
            ->getQuery()->getResult();

        $rapport = [];
        $moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

        for ($m = 1; $m <= 12; $m++) {
            $txMois = array_filter($transactions, fn($t) => (int)$t->getDate()->format('m') === $m);

            $entreesBanque = 0; $sortiesBanque = 0;
            $entreesEspeces = 0; $sortiesEspeces = 0;
            $parCategorie = [];

            foreach ($txMois as $t) {
                $montant = (float) $t->getMontant();
                $isBanque = $t->getModePaiement() === 'banque';
                $isEntree = $t->getType() === 'entree';
                $cat = $t->getCategorie();
                $catId = $cat->getId();
                $catNom = $cat->getNom();

                if (!isset($parCategorie[$catId])) {
                    $parCategorie[$catId] = [
                        'id'     => $catId,
                        'nom'    => $catNom,
                        'entree' => 0,
                        'sortie' => 0,
                    ];
                }
                $parCategorie[$catId][$t->getType()] += $montant;

                if ($isBanque) {
                    $isEntree ? $entreesBanque += $montant : $sortiesBanque += $montant;
                } else {
                    $isEntree ? $entreesEspeces += $montant : $sortiesEspeces += $montant;
                }
            }

            $rapport[$moisNoms[$m-1]] = [
                'banque' => [
                    'entrees' => $entreesBanque,
                    'sorties' => $sortiesBanque,
                    'solde' => $entreesBanque - $sortiesBanque,
                ],
                'especes' => [
                    'entrees' => $entreesEspeces,
                    'sorties' => $sortiesEspeces,
                    'solde' => $entreesEspeces - $sortiesEspeces,
                ],
                'total_entrees' => $entreesBanque + $entreesEspeces,
                'total_sorties' => $sortiesBanque + $sortiesEspeces,
                'balance' => ($entreesBanque + $entreesEspeces) - ($sortiesBanque + $sortiesEspeces),
                'par_categorie' => $parCategorie,
            ];
        }

        return $this->json(['annee' => $annee, 'rapport' => $rapport]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Transaction $transaction): JsonResponse
    {
        return $this->json($this->serialize($transaction));
    }

    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_TRESORIER')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $transaction = new Transaction();
        $this->hydrate($transaction, $data);
        $transaction->setSaisirPar($this->getUser());
        $transaction->setExercice((int) $transaction->getDate()->format('Y'));

        $this->em->persist($transaction);
        $this->em->flush();

        $this->logger->log('CREATE', 'Transaction', $transaction->getId(), [
            'montant'      => $transaction->getMontant(),
            'type'         => $transaction->getType(),
            'categorie'    => $transaction->getCategorie()?->getNom(),
            'modePaiement' => $transaction->getModePaiement(),
        ], $this->getUser());

        return $this->json($this->serialize($transaction), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_TRESORIER')]
    public function update(Transaction $transaction, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->hydrate($transaction, $data);
        $transaction->setExercice((int) $transaction->getDate()->format('Y'));
        $this->em->flush();
        $this->logger->log('UPDATE', 'Transaction', $transaction->getId(), [
            'montant'      => $transaction->getMontant(),
            'type'         => $transaction->getType(),
            'categorie'    => $transaction->getCategorie()?->getNom(),
            'modePaiement' => $transaction->getModePaiement(),
        ], $this->getUser());
        return $this->json($this->serialize($transaction));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Transaction $transaction): JsonResponse
    {
        $this->logger->log('DELETE', 'Transaction', $transaction->getId(), [
            'montant'   => $transaction->getMontant(),
            'type'      => $transaction->getType(),
            'categorie' => $transaction->getCategorie()?->getNom(),
        ], $this->getUser());
        $this->em->remove($transaction);
        $this->em->flush();
        return $this->json(['message' => 'Transaction supprimée']);
    }

    private function calculerSoldes(array $transactions): array
    {
        $banqueEntrees = $banqueSorties = $especesEntrees = $especesSorties = 0;

        foreach ($transactions as $t) {
            $montant = (float) $t->getMontant();
            $isBanque = $t->getModePaiement() === 'banque';
            $isEntree = $t->getType() === 'entree';

            if ($isBanque) {
                $isEntree ? $banqueEntrees += $montant : $banqueSorties += $montant;
            } else {
                $isEntree ? $especesEntrees += $montant : $especesSorties += $montant;
            }
        }

        return [
            'banque' => [
                'entrees' => $banqueEntrees,
                'sorties' => $banqueSorties,
                'solde' => $banqueEntrees - $banqueSorties,
            ],
            'especes' => [
                'entrees' => $especesEntrees,
                'sorties' => $especesSorties,
                'solde' => $especesEntrees - $especesSorties,
            ],
            'total_entrees' => $banqueEntrees + $especesEntrees,
            'total_sorties' => $banqueSorties + $especesSorties,
            'solde_global' => ($banqueEntrees + $especesEntrees) - ($banqueSorties + $especesSorties),
        ];
    }

    private function hydrate(Transaction $t, array $data): void
{
    if (isset($data['date'])) $t->setDate(new \DateTime($data['date']));
    if (isset($data['type'])) $t->setType($data['type']);
    if (isset($data['categorieId'])) {
        $cat = $this->em->getReference(\App\Entity\Categorie::class, $data['categorieId']);
        $t->setCategorie($cat);
    }
    if (isset($data['montant'])) $t->setMontant($data['montant']);
    if (isset($data['modePaiement'])) $t->setModePaiement($data['modePaiement']);
    if (isset($data['description'])) $t->setDescription($data['description']);
    if (isset($data['pieceJointe'])) $t->setPieceJointe($data['pieceJointe']);

    if (array_key_exists('membreId', $data)) {
        $membre = $data['membreId']
            ? $this->em->getRepository(\App\Entity\Membre::class)->find($data['membreId'])
            : null;
        $t->setMembre($membre);
    }
}

    private function serialize(Transaction $t): array
{
    return [
        'id' => $t->getId(),
        'date' => $t->getDate()->format('Y-m-d'),
        'type' => $t->getType(),
        'categorie' => $t->getCategorie() ? [
            'id' => $t->getCategorie()->getId(),
            'nom' => $t->getCategorie()->getNom(),
            'type' => $t->getCategorie()->getType(),
            'couleur' => $t->getCategorie()->getCouleur(),
        ] : null,
        'montant' => (float) $t->getMontant(),
        'modePaiement' => $t->getModePaiement(),
        'description' => $t->getDescription(),
        'pieceJointe' => $t->getPieceJointe(),
        'exercice' => $t->getExercice(),
        'saisirPar' => $t->getSaisirPar()?->getPrenom() . ' ' . $t->getSaisirPar()?->getNom(),
        'membre' => $t->getMembre() ? [
            'id'     => $t->getMembre()->getId(),
            'nom'    => $t->getMembre()->getNom(),
            'prenom' => $t->getMembre()->getPrenom(),
        ] : null,
    ];
}
}
