<?php

namespace App\Entity;

use App\Repository\ActionLogRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ActionLogRepository::class)]
#[ORM\Table(name: 'action_log')]
class ActionLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $utilisateur = null;

    #[ORM\Column(length: 20)]
    private string $action; // CREATE, UPDATE, DELETE

    #[ORM\Column(length: 50)]
    private string $module; // Transaction, Membre, Categorie...

    #[ORM\Column(nullable: true)]
    private ?int $entiteId = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $details = null;

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ip = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUtilisateur(): ?User { return $this->utilisateur; }
    public function setUtilisateur(?User $utilisateur): static
    {
        $this->utilisateur = $utilisateur;
        return $this;
    }

    public function getAction(): string { return $this->action; }
    public function setAction(string $action): static
    {
        $this->action = $action;
        return $this;
    }

    public function getModule(): string { return $this->module; }
    public function setModule(string $module): static
    {
        $this->module = $module;
        return $this;
    }

    public function getEntiteId(): ?int { return $this->entiteId; }
    public function setEntiteId(?int $entiteId): static
    {
        $this->entiteId = $entiteId;
        return $this;
    }

    public function getDetails(): ?array { return $this->details; }
    public function setDetails(?array $details): static
    {
        $this->details = $details;
        return $this;
    }

    public function getIp(): ?string { return $this->ip; }
    public function setIp(?string $ip): static
    {
        $this->ip = $ip;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
