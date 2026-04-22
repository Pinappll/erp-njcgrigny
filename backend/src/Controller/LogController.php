<?php

namespace App\Controller;

use App\Repository\ActionLogRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/logs')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class LogController extends AbstractController
{
    public function __construct(
        private ActionLogRepository $repo
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $qb = $this->repo->createQueryBuilder('l')
            ->leftJoin('l.utilisateur', 'u')
            ->addSelect('u');

        if ($module = $request->query->get('module')) {
            $qb->andWhere('l.module = :module')
               ->setParameter('module', $module);
        }

        if ($action = $request->query->get('action')) {
            $qb->andWhere('l.action = :action')
               ->setParameter('action', $action);
        }

        if ($userId = $request->query->get('userId')) {
            $qb->andWhere('l.utilisateur = :user')
               ->setParameter('user', $userId);
        }

        if ($depuis = $request->query->get('depuis')) {
            $qb->andWhere('l.createdAt >= :depuis')
               ->setParameter('depuis', new \DateTimeImmutable($depuis));
        }

        $logs = $qb->orderBy('l.createdAt', 'DESC')
                   ->setMaxResults(100)
                   ->getQuery()
                   ->getResult();

        return $this->json([
            'total' => count($logs),
            'logs'  => array_map(fn($l) => [
                'id'          => $l->getId(),
                'action'      => $l->getAction(),
                'module'      => $l->getModule(),
                'entiteId'    => $l->getEntiteId(),
                'details'     => $l->getDetails(),
                'ip'          => $l->getIp(),
                'createdAt'   => $l->getCreatedAt()->format('Y-m-d H:i:s'),
                'utilisateur' => $l->getUtilisateur()
                    ? $l->getUtilisateur()->getPrenom().' '.$l->getUtilisateur()->getNom()
                    : 'Système',
            ], $logs),
        ]);
    }
}
