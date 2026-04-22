<?php

namespace App\Entity;

use App\Repository\MaterielRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MaterielRepository::class)]
#[ORM\Table(name: 'materiel')]
class Materiel
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    private string $nom;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 30)]
    private string $categorie = 'autre'; // sono, informatique, mobilier, autre

    #[ORM\Column(length: 20)]
    private string $etat = 'bon'; // bon, moyen, mauvais, hors_service

    #[ORM\Column]
    private int $quantite = 1;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $localisation = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTime $dateAchat = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    private ?string $valeurAchat = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $facturePj = null; // chemin ou URL de la facture

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getCategorie(): string { return $this->categorie; }
    public function setCategorie(string $categorie): static { $this->categorie = $categorie; return $this; }

    public function getEtat(): string { return $this->etat; }
    public function setEtat(string $etat): static { $this->etat = $etat; return $this; }

    public function getQuantite(): int { return $this->quantite; }
    public function setQuantite(int $quantite): static { $this->quantite = $quantite; return $this; }

    public function getLocalisation(): ?string { return $this->localisation; }
    public function setLocalisation(?string $localisation): static { $this->localisation = $localisation; return $this; }

    public function getDateAchat(): ?\DateTime { return $this->dateAchat; }
    public function setDateAchat(?\DateTime $dateAchat): static { $this->dateAchat = $dateAchat; return $this; }

    public function getValeurAchat(): ?string { return $this->valeurAchat; }
    public function setValeurAchat(?string $valeurAchat): static { $this->valeurAchat = $valeurAchat; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getFacturePj(): ?string { return $this->facturePj; }
    public function setFacturePj(?string $facturePj): static { $this->facturePj = $facturePj; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
