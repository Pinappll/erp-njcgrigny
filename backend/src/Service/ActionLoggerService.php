<?php

namespace App\Service;

use App\Entity\ActionLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class ActionLoggerService
{
    public function __construct(
        private EntityManagerInterface $em,
        private RequestStack $requestStack
    ) {}

    public function log(
        string $action,
        string $module,
        ?int $entiteId = null,
        ?array $details = null,
        ?User $utilisateur = null
    ): void {
        $log = new ActionLog();
        $log->setAction($action);
        $log->setModule($module);
        $log->setEntiteId($entiteId);
        $log->setDetails($details);
        $log->setUtilisateur($utilisateur);

        $request = $this->requestStack->getCurrentRequest();
        if ($request) {
            $log->setIp($request->getClientIp());
        }

        $this->em->persist($log);
        $this->em->flush();
    }
}
