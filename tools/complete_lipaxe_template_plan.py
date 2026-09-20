from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor


SOURCE = Path(r"C:\Users\Rodrigue\Documents\lipax docs\Plan d'affaire lipaxe.docx")
OUTPUT = Path(r"C:\Users\Rodrigue\Documents\lipax docs\Plan d'affaires LIPAXE RDC canevas complete v4.docx")


# The user-facing plan must be written in proper French.  The source template
# contains its own typography; this normalisation only corrects generated text.
FRENCH_REPLACEMENTS = (
    ("Republique democratique", "République démocratique"),
    ("republique democratique", "république démocratique"),
    ("actualisee", "actualisée"), ("actualise", "actualisé"),
    ("securisee", "sécurisée"), ("securite", "sécurité"),
    ("conformite", "conformité"), ("reglement", "règlement"),
    ("reglements", "règlements"), ("tresorerie", "trésorerie"),
    ("propriete", "propriété"), ("societe", "société"),
    ("comptabilite", "comptabilité"), ("qualite", "qualité"),
    ("fiabilite", "fiabilité"), ("disponibilite", "disponibilité"),
    ("echeances", "échéances"), ("echeance", "échéance"),
    ("evenementiel", "événementiel"), ("evenements", "événements"),
    ("education", "éducation"), ("hotellerie", "hôtellerie"),
    ("strategie", "stratégie"), ("strategies", "stratégies"),
    ("operations", "opérations"), ("operation", "opération"),
    ("integration", "intégration"), ("integrations", "intégrations"),
    ("reconciliation", "réconciliation"), ("reconciliations", "réconciliations"),
    ("previsions", "prévisions"), ("resultat", "résultat"),
    ("couts", "coûts"), ("cout", "coût"), ("periodes", "périodes"),
    ("periode", "période"), ("annees", "années"), ("annee", "année"),
    ("employes", "employés"), ("employe", "employé"),
    ("activites", "activités"), ("activite", "activité"),
    ("differentes", "différentes"), ("differents", "différents"),
    ("necessaires", "nécessaires"), ("necessaire", "nécessaire"),
    ("reelles", "réelles"), ("reelle", "réelle"), ("reel", "réel"),
    ("creer", "créer"), ("creation", "création"),
    ("deployer", "déployer"), ("deploiement", "déploiement"),
    ("marche", "marché"), ("marches", "marchés"),
    ("meme", "même"), ("etre", "être"), ("etes", "êtes"),
    ("deja", "déjà"), ("apres", "après"),
    ("A completer", "À compléter"), ("A confirmer", "À confirmer"),
    ("A definir", "À définir"), ("A renseigner", "À renseigner"),
    ("A calculer", "À calculer"), ("A budgéter", "À budgéter"),
)


def frenchify(text):
    for source, target in FRENCH_REPLACEMENTS:
        text = text.replace(source, target)
        text = text.replace(source.capitalize(), target.capitalize())
    return text


def set_paragraph(paragraph, text, bold=False, size=9.5):
    text = frenchify(text)
    for run in paragraph.runs:
        run._element.getparent().remove(run._element)
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.name = "Aptos"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor(28, 38, 34)
    paragraph.paragraph_format.space_after = Pt(3)
    return paragraph


def set_cell(table, row, column, text, bold=False, size=8.5):
    cell = table.cell(row, column)
    paragraph = cell.paragraphs[0]
    set_paragraph(paragraph, text, bold=bold, size=size)
    for extra in cell.paragraphs[1:]:
        set_paragraph(extra, "", size=size)


def fill_rows(table, items, column=0, start=0, size=8.2):
    for offset, item in enumerate(items):
        row = start + offset
        if row >= len(table.rows):
            break
        set_cell(table, row, column, item, size=size)


def replace_paragraphs(document):
    replacements = {
        "PLAN D’AFFAIRE": "PLAN D'AFFAIRES",
        "Lipaxe SA": "LIPAXE SA - Paiements et systeme marchand",
        "Moi et Année": "Version actualisee - Septembre 2026",
        "Le plan d’affaires est un outil essentiel": (
            "Le present plan d'affaires presente LIPAXE comme une plateforme de paiements reliee a un systeme marchand. "
            "Sa logique est de creer simultanement le moyen de payer et les activites concretes dans lesquelles ce moyen de paiement est utilise."
        ),
        "Le présent guide de plan d’affaires": (
            "LIPAXE ne se limite pas a un wallet. La plateforme permet a des marchands de creer et gerer leurs businesses, leurs produits, "
            "leurs clients, leurs factures, leurs caisses, leurs equipes et leurs encaissements. Chaque paiement produit une preuve, une transaction "
            "marchand et une trace comptable."
        ),
        "En tout temps, vous pouvez annexer": (
            "Les annexes a joindre avant engagement financier sont : etude de marche par pays et ville, contrats ou devis de fournisseurs, avis "
            "juridiques, politique de reserves, grille tarifaire, modele financier, plan de securite et dossiers KYB des premiers marchands."
        ),
        "Bon succès !": "Document de travail confidentiel - LIPAXE SA",
        "Vous devez remplir cette section": (
            "Presentation sommaire du projet. Les informations ci-dessous decrivent le modele LIPAXE actualise : infrastructure de paiement et "
            "systeme d'exploitation marchand deploye progressivement par secteurs et zones pilotes."
        ),
        "Planifiez les principales étapes": (
            "Calendrier de realisation adapte a un lancement pilote. Les dates sont conditionnees par la disponibilite des integrations, les "
            "validations de conformite et la preparation effective des marchands pilotes."
        ),
        "Dans cette section, vous devez indiquer": (
            "Le promoteur doit joindre son CV et documenter les competences necessaires a la conduite de LIPAXE : strategie fintech, produit, "
            "developpement logiciel, securite, ventes B2B, operations, finance et conformite."
        ),
        "Entreprise Unipersonnel": (
            "Forme juridique retenue : LIPAXE SA, sous reserve de la finalisation des formalites et de la structure actionnariale applicable "
            "dans chaque pays d'operation."
        ),
        "Indiquez la répartition": (
            "La repartition definitive de la propriete doit etre documentee dans une convention d'actionnaires. Aucun pourcentage ne doit etre "
            "declare comme definitif avant la signature des fondateurs et, le cas echeant, des investisseurs."
        ),
        "Décrivez ce secteur d’activité": (
            "LIPAXE opere dans les services financiers numeriques, les paiements, les logiciels de gestion marchande et les integrations de "
            "paiement. Le secteur est regulé, sensible a la confiance et dependant de partenariats techniques et de distribution."
        ),
        "Énumérez les forces et les faiblesses": (
            "Le besoin existe car les paiements restent souvent separes des operations du marchand. Cash, mobile money, banques et outils de caisse "
            "ne produisent pas toujours une seule vue de la vente, du client, du stock, de la facture et du reglement."
        ),
        "Quelles sont les tendances": (
            "La tendance est a la digitalisation des encaissements, a la preuve immediate de paiement, a la gestion mobile des PME et a "
            "l'interoperabilite. LIPAXE doit transformer ces tendances en usage regulier chez des marchands reels, non en simple telechargement d'application."
        ),
        "Quels sont les critères ou habitudes": (
            "Les marchands recherchent avant tout la fiabilite, la simplicite d'encaissement, la preuve de paiement, le cout total, la rapidite "
            "du reglement, le support et la capacite a former leurs equipes. Les clients recherchent la confiance, le prix, la disponibilite et le recu."
        ),
        "Comment fixerez-vous vos prix": (
            "La tarification sera construite a partir du cout fournisseur, du cout de support, du risque, de la devise, du volume et de la valeur "
            "du module marchand. Les prix definitifs seront testes avec les pilotes et affiches avant confirmation de chaque operation."
        ),
        "Indiquez quelles seront vos politiques": (
            "Les remboursements, rabais et credits sont geres par workflow : motif obligatoire, permissions, plafonds, validation et trace "
            "d'audit. Aucun agent ne modifie un solde ou une transaction sans ecriture de correction tracee."
        ),
        "Quels seront les moyens de communication": (
            "La promotion combine vente terrain B2B, demonstration chez les marchands, partenariats sectoriels, affichage QR au point de vente, "
            "onboarding client, reseaux sociaux et support de proximite."
        ),
        "Indiquez quel moyen vous comptez": (
            "LIPAXE est distribue par une equipe commerciale, des partenaires sectoriels, des revendeurs ou integrateurs qualifies et des "
            "parcours digitaux. Les marchands sont onboardes avec KYB, formation, configuration et periode d'hypercare."
        ),
        "Pourquoi cette localisation": (
            "La localisation privilegie les zones de forte frequence de paiement : centres commerciaux, campus, zones de sante, gares, "
            "hotels, evenements et corridors de commerce. L'expansion suit la densite d'usage, non une logique de presence symbolique."
        ),
        "Décrivez toutes les étapes": (
            "Le processus operationnel est celui d'une vente tracee : creation de l'objet commercial, intention de paiement, authentification "
            "client, debit et ecriture de wallet, transaction marchand, recu, notification, rapprochement et reglement selon les regles applicables."
        ),
        "Si vous devez aménager": (
            "LIPAXE privilegie une infrastructure legere : equipement informatique securise, connectivite, terminaux ou QR, support et formation. "
            "Les besoins physiques varient selon le reseau de partenaires et doivent etre couverts par devis."
        ),
        "Mentionnez ici les permis": (
            "Les autorisations et obligations doivent etre verifiees pays par pays avant lancement. Elles couvrent notamment la qualification des "
            "services, la protection des donnees, le KYB/KYC, la fiscalite, les contrats fournisseurs, la conservation des preuves et les obligations de declaration."
        ),
        "Combien d'emplois": (
            "Le demarrage requiert une equipe reduite mais specialisee : produit et technologie, operations paiements, finance operations, "
            "conformite/KYB, ventes marchands et support. Les effectifs evoluent selon le nombre de marchands actifs et les obligations locales."
        ),
        "Prévoyez-vous la création d'emplois additionnels": (
            "Oui. Les recrutements de la deuxieme et troisieme annee dependent de l'atteinte des seuils de marchands actifs, de volume, de support "
            "et de conformite. Les postes prioritaires seront ventes terrain, support, operations et risque."
        ),
        "La main-d’œuvre nécessaire": (
            "Les competences fintech tres specialisees peuvent etre rares localement. LIPAXE combine recrutement local, formation interne, "
            "documentation de procedures et recours cible a des experts externes."
        ),
        "Prévoyez-vous de l'aide": (
            "Oui. LIPAXE recherchera des partenariats avec des universites, incubateurs, programmes emploi et reseaux professionnels, sans "
            "dependre d'une subvention non confirmee dans le budget de base."
        ),
        "Quelle formation donnerez-vous": (
            "Chaque collaborateur recoit une formation sur les produits, la securite, les donnees personnelles, le KYB, la prevention de fraude, "
            "le support, les escalades et les procedures de correction financiere."
        ),
        "Avez-vous des besoins de main-d’œuvre saisonniers": (
            "Oui, principalement lors des lancements, evenements, rentrees scolaires et periodes de forte activite commerciale. Les renforts "
            "sont formes et limites aux droits necessaires."
        ),
    }
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        for needle, value in replacements.items():
            if needle in text:
                set_paragraph(paragraph, value, bold=(needle == "PLAN D’AFFAIRE"), size=10)
                break


def fill_tables(doc):
    tables = doc.tables

    # Page de presentation et sommaire.
    set_cell(tables[0], 1, 0, "RODRIGUE IRAGI - Fondateur et promoteur")
    set_cell(tables[5], 0, 0, "Resume du projet : LIPAXE combine un reseau de paiements et un systeme marchand. Le wallet devient utile parce que les clients peuvent payer chez des commerces, ecoles, hopitaux, transporteurs, hotels, services et evenements ; les marchands adoptent LIPAXE parce qu'ils y gerent aussi leurs ventes et operations.")
    fill_rows(tables[1], [
        "Rodrigue Iragi - Fondateur, strategie et produit",
        "LIPAXE SA - Coordonnees administratives a finaliser dans les statuts",
        "Email et telephone professionnels a renseigner dans la version de depot",
    ], start=1)
    fill_rows(tables[2], [
        "Plan d'affaires LIPAXE",
        "Paiements, wallet et systeme marchand",
        "Version Septembre 2026",
    ])
    fill_rows(tables[3], [
        "Burundi - Rwanda - RDC",
        "Lancement pilote par zones et secteurs",
        "Document confidentiel",
        "A completer par les validations juridiques et financieres",
    ])
    set_cell(tables[4], 0, 0, "Table des matieres mise a jour dans Word avant impression finale.")

    t = tables[6]
    set_cell(t, 0, 1, "LIPAXE est une plateforme de paiement et de gestion marchande. Elle donne aux particuliers un wallet utile dans des lieux reels et aux entreprises un systeme pour vendre, facturer, encaisser, gerer leur caisse et suivre leurs fonds.", size=8)
    set_cell(t, 3, 1, "LIPAXE SA", bold=True)
    set_cell(t, 5, 1, "Rodrigue Iragi - Fondateur")
    set_cell(t, 8, 1, "Conception produit et fintech ; pilotage des modules wallet, paiements, marchand, securite et operations. CV et preuves d'experience a joindre.")
    set_cell(t, 12, 1, "Siege administratif a confirmer ; operations organisees par pays et zones pilotes.")
    set_cell(t, 15, 1, "Demarrage : equipe coeur de 6 a 8 roles. Croissance : ventes terrain, support, operations et conformite selon l'activite.")
    set_cell(t, 18, 0, "Budget initial : infrastructure, securite, KYB, onboarding marchand, formation, support, reserves et fonds de roulement. Montant : a finaliser apres devis.")
    set_cell(t, 18, 1, "Sources : apport fondateur, investisseurs, partenaires et financement conforme. Aucun montant n'est engage sans plan de tresorerie valide.")
    set_cell(t, 26, 1, "Revenus : frais d'acceptation, abonnements logiciels, services terminaux, integrations et services de reglement. Previsions chiffrees dans le modele financier.")
    set_cell(t, 28, 1, "Lancement pilote cible : 4-5 septembre 2026, sous reserve des preconditions techniques, juridiques et commerciales.")

    set_cell(tables[7], 0, 0, "Calendrier de realisation LIPAXE : les activites sont organisees autour de la disponibilite reelle des paiements, du KYB marchand, de la qualite de service, du rapprochement et de l'adoption. Le passage a l'etape suivante exige la validation des seuils definis.")
    fill_rows(tables[8], [
        "Finaliser le modele marchand, les roles, le ledger et les workflows critiques",
        "Verifier les integrations fournisseurs par pays et separer sandbox/production",
        "Completer KYB, contrats pilotes et politique de reserves",
        "Selectionner les premiers clusters de marchands",
        "Configurer les businesses, unites, catalogues et terminaux ou QR",
        "Former les equipes marchandes et support",
        "Executer des paiements de bout en bout et rapprocher les ecritures",
        "Lancer le pilote avec hypercare",
        "Mesurer l'usage, les echecs, les remboursements et les ecarts",
        "Stabiliser avant densification",
        "Etendre aux secteurs et zones valides",
        "Completer et faire approuver l'etude de marche et le modele financier",
        "Revue de direction et decision d'extension",
    ], column=0, start=1)
    fill_rows(tables[8], [
        "Avant septembre 2026", "Avant septembre 2026", "Avant septembre 2026", "Avant septembre 2026",
        "Semaine de lancement", "Semaine de lancement", "Semaine de lancement", "4-5 septembre 2026",
        "Semaines 1 a 4", "Semaines 1 a 4", "Mois 2 a 4", "Avant investissement majeur", "Apres pilote",
    ], column=1, start=1)

    set_cell(tables[9], 0, 0, "LIPAXE repond a l'absence de lien entre les moyens de paiement et les activites ou les personnes doivent effectivement payer. Le projet associe un wallet regional a un systeme marchand modulaire.")
    fill_rows(tables[10], [
        "LIPAXE est ne d'un constat : la disponibilite d'un wallet ne garantit pas son usage.",
        "Le client doit trouver des lieux de paiement utiles ; le marchand doit gagner plus qu'un simple bouton de paiement.",
        "Le projet integre donc les fonctions de commerce, facturation, caisse, stock, billets, reservations, paie et reglement.",
        "Le coeur financier reste separe des verticaux pour reduire le risque et faciliter l'evolution.",
        "Les premiers verticaux vises sont commerce, education, sante, transport, hotellerie, evenementiel et services.",
        "Le lancement est progressif, par pays, ville, secteur et partenaire.",
        "Les paiements QR, wallet et NFC mobile compatible sont relies a des tokens signes et a des controles de risque.",
        "Chaque mouvement de fonds doit etre trace, rapproche et explicable.",
        "La croissance vise la densite d'usage et la retention, non le nombre de comptes inactifs.",
    ])
    set_cell(tables[11], 0, 0, "Mission : rendre le paiement numerique utile au quotidien en reliant le wallet des clients aux activites reelles des marchands, avec une gestion simple, fiable et securisee.")
    fill_rows(tables[12], [
        "Permettre au client de payer, recevoir une preuve et retrouver son historique.",
        "Permettre au marchand de creer et gerer son business, ses unites et ses equipes.",
        "Permettre la gestion des produits, services, factures, commandes et encaissements.",
        "Assurer un ledger fiable, des reglements rapprochees et des workflows de remboursement.",
        "Deployer un KYB, des roles, des permissions et une piste d'audit adaptes.",
        "Prioriser les integrations et pays reellement operationnels.",
        "Construire une offre par vertical sans fragiliser le coeur de paiement.",
        "Mesurer la qualite de service, le risque, la liquidite et l'adoption.",
        "Assurer une communication claire dans les langues prioritaires selon le marche.",
        "Maintenir les canaux non disponibles desactives plutot que de promettre un service non opere.",
    ])
    fill_rows(tables[14], [
        "Atteindre une base de marchands pilotes actifs et verifiables.",
        "Creer des points d'usage recurrent du wallet LIPAXE.",
        "Prouver le flux QR/NFC mobile/wallet vers transaction marchand et ledger.",
        "Reduire les reconciliations manuelles des marchands pilotes.",
        "Mettre en place les controles de reserves, de risques et de conformite.",
        "Etendre uniquement apres validation des seuils de qualite et d'adoption.",
    ])
    fill_rows(tables[15], [
        "Territoire cible : Burundi, Rwanda et RDC.",
        "Approche : lancement par villes et clusters d'usage.",
        "Zones prioritaires : commerce, campus, sante, transport, hotellerie et evenements.",
        "Bureaux physiques limits ; operations hybrides avec partenaires.",
        "Chaque pays dispose de parametres de devise, reglementation et fournisseurs.",
        "Les canaux non operationnels restent desactives dans le produit.",
        "La densite de marchands prevaut sur l'expansion geographique.",
        "Les corridors regionaux seront actives apres validation technique et conformite.",
    ])

    set_cell(tables[16], 0, 1, "Rodrigue Iragi")
    set_cell(tables[16], 1, 1, "A completer")
    set_cell(tables[16], 2, 1, "Fondateur - Strategie, produit et ecosysteme LIPAXE")
    set_cell(tables[16], 3, 1, "A completer dans le dossier legal")
    set_cell(tables[16], 4, 1, "A completer dans le dossier legal")
    set_cell(tables[17], 0, 1, "Co-promoteur ou administrateur a confirmer")
    set_cell(tables[17], 1, 1, "A completer")
    set_cell(tables[17], 2, 1, "Finance, conformite ou operations")
    set_cell(tables[17], 3, 1, "A completer")
    set_cell(tables[17], 4, 1, "A completer")
    set_cell(tables[18], 0, 0, "Profil du promoteur : le projet requiert des competences complementaires. Le dossier de financement doit joindre les CV, les references pertinentes, la structure de gouvernance et les preuves de capacite d'execution.")
    fill_rows(tables[19], [
        "Vision produit : comprendre le besoin de lier paiement et usage marchand.",
        "Pilotage : transformer une architecture de paiement en operations quotidiennes.",
        "Technologie : conception d'APIs, wallet, ledger, QR, notifications et portails.",
        "Marchand : construction de modules par vertical et roles equipe.",
        "Securite : tokens courts, signatures, nonces, audit et controles d'acces.",
        "Finance : suivi des frais, reserves, rapprochement et reglements.",
        "Partenariats : fournisseurs de paiement, commerces, institutions et reseaux.",
        "Vente B2B : onboarding, formation et accompagnement des marchands.",
        "Support : procedures d'incident, refund, litige et escalation.",
        "Conformite : KYB, preuves, conservation et parametres par pays.",
        "Competence a renforcer : expertise juridique locale.",
        "Competence a renforcer : gestion de tresorerie multi-devises.",
        "Competence a renforcer : distribution terrain par secteur.",
        "Competence a renforcer : operations de fournisseurs de paiement.",
        "Document requis : CV du promoteur.",
        "Document requis : organigramme cible.",
        "Document requis : conventions d'actionnaires.",
        "Document requis : lettres d'intention de partenaires.",
        "Document requis : politique securite et risque.",
        "Document requis : etude de marche.",
        "Document requis : modele financier detaille.",
        "Document requis : plan de deploiement pilote.",
    ])
    fill_rows(tables[20], [
        "Profil complementaire recherche : finance et treasury.",
        "Profil complementaire recherche : conformite et affaires reglementaires.",
        "Profil complementaire recherche : ventes B2B et operations marchandes.",
        "Profil complementaire recherche : securite et fiabilite des paiements.",
    ])

    set_cell(tables[21], 0, 0, "Forme juridique envisagee : LIPAXE SA ou structure equivalente selon le pays d'immatriculation. Les statuts, l'actionnariat, les delegations de pouvoirs et les obligations des entites operationnelles seront finalises avec conseil juridique.")
    fill_rows(tables[22], [
        "LIPAXE SA",
        "Societe anonyme ou forme equivalente a confirmer selon le pays d'immatriculation",
        "Gouvernance : conseil ou administrateurs, direction, controle finance et conformite",
        "Structure multi-pays : filiales, succursales ou partenaires, apres avis juridique",
    ])
    set_cell(tables[24], 2, 0, "Rodrigue Iragi")
    set_cell(tables[24], 2, 1, "A formaliser")
    set_cell(tables[24], 2, 2, "Propriete intellectuelle et travail fondateur a documenter")
    set_cell(tables[24], 2, 3, "A definir dans la convention")
    set_cell(tables[24], 3, 0, "Investisseurs ou cofondateurs futurs")
    set_cell(tables[24], 3, 1, "Selon tour de financement")
    set_cell(tables[24], 3, 2, "Selon contrat")
    set_cell(tables[24], 3, 3, "Selon convention")
    fill_rows(tables[25], [
        "Direction generale : strategie, partenariats, budget et gouvernance.",
        "Produit et technologie : roadmap, architecture, qualite et securite applicative.",
        "Payments operations : flux de paiement, fournisseurs, callbacks et rapprochement.",
        "Finance operations : reserves, frais, reglements, depenses et paie.",
        "Risque et conformite : KYB, controles, alertes, preuves et escalade.",
        "Commercial marchand : acquisition, onboarding, formation et retention.",
        "Support client et marchand : incidents, communication et suivi.",
        "Marketing : activation des usages autour des points d'acceptation.",
        "Data et reporting : indicateurs adoption, finance, risque et qualite.",
        "Principe : aucune personne ne peut initier, approuver et payer seule une sortie de fonds.",
        "Principe : les roles sont verifies cote serveur et audites.",
        "Principe : les verticals ne modifient pas directement le coeur de paiement.",
    ])
    set_cell(tables[26], 1, 1, "Cabinet comptable a designer")
    set_cell(tables[26], 2, 1, "Conseil juridique fintech local a designer")
    set_cell(tables[26], 3, 1, "Notaire ou conseil corporate a designer")
    set_cell(tables[26], 4, 1, "Mentor fintech, paiements ou distribution B2B a designer")
    set_cell(tables[26], 5, 1, "Audit securite, fiscalite, fournisseurs de paiement et telecoms")

    set_cell(tables[27], 0, 0, "Wallets multi-devises ; paiements QR ; NFC entre appareils mobiles compatibles ; transferts ; cartes selon fournisseur ; portail marchand ; catalogue ; factures ; commandes ; stock ; caisse ; billets ; reservations ; gestion des employes, depenses, paie, reglements, refunds, litiges, webhooks et audit.")
    set_cell(tables[27], 1, 0, "Principe produit : le paiement est relie a un objet commercial et a une ecriture fiable. Les modules sectoriels servent le marchand sans contourner les controles du coeur financier.")
    fill_rows(tables[28], [
        "Services financiers numeriques et logiciel marchand.",
        "Marche B2C : utilisateurs wallets et payeurs.",
        "Marche B2B : marchands, institutions et operateurs multi-sites.",
    ])
    fill_rows(tables[29], [
        "Le secteur combine paiement, distribution, logiciel SaaS et operations de terrain.",
        "La barriere principale est la confiance : disponibilite, preuve, support, securite et conformite.",
        "La valeur augmente avec le nombre de lieux ou le client peut payer.",
        "La valeur augmente avec les modules qui reduisent le travail administratif du marchand.",
        "Le lancement doit etre progressif car fournisseurs, pays, devises et obligations different.",
    ])
    set_cell(tables[30], 0, 0, "Analyse des forces et faiblesses du secteur et de la proposition LIPAXE.")
    set_cell(tables[30], 1, 0, "Forces : coeur de paiement relie a un vrai systeme marchand ; architecture modulaire ; roles, audit et ledger ; offre adaptee aux secteurs.")
    set_cell(tables[30], 2, 0, "Forces : parcours QR et wallet reutilisable ; factures, commandes, caisse, billetterie et operations reunies.")
    set_cell(tables[30], 3, 0, "Faiblesses a traiter : besoin de partenaires, de liquidite, de conformite locale et de distribution terrain.")
    set_cell(tables[30], 4, 0, "Faiblesses a traiter : marque nouvelle, cout de support et complexite multi-pays.")
    fill_rows(tables[31], [
        "Paiement digital et preuve instantanee.",
        "Digitalisation des PME et des institutions.",
        "Besoin de reporting, d'audit et de controle de caisse.",
        "Croissance des integrations API et webhooks.",
    ])
    fill_rows(tables[32], [
        "Clients particuliers : payeurs recurrents chez les marchands pilotes.",
        "Micro et petites entreprises : commerce, services, restauration et pharmacies.",
        "Institutions : ecoles, universites, cliniques, hopitaux, associations et employeurs.",
        "Operateurs : transport, hotellerie, evenementiel et reseaux multi-sites.",
    ])
    fill_rows(tables[33], [
        "Le client choisit la disponibilite, le cout, la confiance et la simplicite.",
        "Le marchand choisit la rapidite, le recu, le reglement et la reduction des erreurs.",
        "Les institutions privilegient la facturation, les rapports, les roles et les exports.",
        "La frequence depend de la densite des lieux d'acceptation et de la qualite du support.",
    ])
    set_cell(tables[34], 0, 0, "Analyse de la concurrence : l'etude de marche complementaire comparera chaque pays, ville, moyen de paiement, segment marchand, cout de distribution et exigence reglementaire. Les concurrents ci-dessous sont analyses par categorie ; les noms et prix locaux seront confirmes dans l'enquete terrain.")
    fill_rows(tables[35], [
        "Operateurs de mobile money et leurs reseaux d'agents.",
        "Banques, applications bancaires et solutions d'encaissement.",
        "Passerelles de paiement et aggregateurs regionaux.",
        "Solutions de caisse et logiciels de gestion specialises.",
        "Prestataires de cartes et wallets concurrents.",
        "Integrateurs locaux et fournisseurs de terminaux.",
        "Concurrents directs a identifier par ville pilote.",
    ])
    fill_rows(tables[36], [
        "Cash et carnets manuels.",
        "Tableurs et messageries utilises comme preuve de paiement.",
        "Comptabilite interne ou logiciels ERP non relies au wallet.",
        "Paiements directs fournisseur a marchand sans reconciliation.",
        "Cartes et solutions bancaires traditionnelles.",
        "Tous substituts qui remplissent le besoin de payer ou encaisser.",
    ])
    competitors = [
        ("Cash et gestion manuelle", "Universel, immediat", "Risque, absence de trace, reconciliation lente", "A mesurer"),
        ("Mobile money seul", "Usage connu et distribution", "Pas toujours relie au business operationnel", "A mesurer"),
        ("Banque ou carte", "Confiance institutionnelle", "Acces, cout et delai variables", "A mesurer"),
        ("ERP ou caisse isolee", "Gestion specialisee", "Paiement et wallet non natifs", "A mesurer"),
    ]
    for r, values in enumerate(competitors, start=1):
        for c, value in enumerate(values):
            set_cell(tables[37], r, c, value, size=7.5)
    fill_rows(tables[38], [
        "LIPAXE transforme le paiement en evenement de gestion : commande, facture, billet, caisse, stock ou prestation.",
        "Un wallet devient utile car les utilisateurs trouvent des marchands et services ou payer.",
        "Un marchand adopte LIPAXE car il obtient aussi une gestion metier et non un simple lien de paiement.",
        "Le ledger, les roles, le KYB, les refunds et les reglements renforcent la confiance operationnelle.",
    ])
    set_cell(tables[39], 1, 0, "Opportunites : digitalisation des PME ; besoins de preuve ; paiements repetitifs dans l'education, sante, transport et evenements ; partenariats sectoriels ; croissance d'usages regionaux.")
    set_cell(tables[39], 1, 1, "Menaces : contraintes regulatorires, indisponibilite fournisseur, fraude, liquidite insuffisante, faible adoption, concurrence et cout de distribution.")

    set_cell(tables[40], 0, 0, "Plan marketing LIPAXE : l'acquisition est pilotee par des usages et non seulement par de la communication. Chaque point de vente actif doit creer un motif concret pour le client d'ouvrir et d'utiliser son wallet.")
    fill_rows(tables[41], [
        "Frais d'acceptation transparents, annonces avant paiement.",
        "Prix calcules selon cout fournisseur, support, risque, devise et volume.",
        "Abonnements optionnels pour fonctions avancees, multi-sites ou integrations.",
        "Offres pilotes limitees dans le temps et mesurees.",
        "Aucun prix definitif sans validation de marge et de conformite.",
        "Grille par pays et canal active uniquement si le canal est operationnel.",
    ])
    fill_rows(tables[42], [
        "Factures avec echeances et preuves de paiement.",
        "Rabais autorises par role et traces.",
        "Remboursements soumis a motif, plafond, validation et ecriture ledger.",
        "Credits marchands controles par politique finance.",
        "Litiges documentes avec notification et historique de decision.",
    ])
    fill_rows(tables[43], [
        "Demonstrations terrain et onboarding de marchands pilotes.",
        "Partenariats avec ecoles, sante, commerce, transport et organisateurs d'evenements.",
        "Communication QR au point de vente, tutoriels client et recu transactionnel.",
        "Contenu digital, referencement public, reseaux sociaux et support de proximite.",
    ])
    fill_rows(tables[44], [
        "Vente directe B2B aux marchands pilotes.",
        "Onboarding KYB et verification avant activation.",
        "Configuration du business, de l'unite, des roles et du wallet de reglement.",
        "Configuration du catalogue, des prix, de la caisse, des factures ou du vertical.",
        "Terminal ou QR selon disponibilite et besoin.",
        "Formation de l'equipe et simulation de paiement.",
        "Hypercare de lancement et support incident.",
        "Partenaires sectoriels et integrateurs qualifies.",
        "Parrainage conditionne a l'activite reelle.",
        "Expansion par cluster de lieux d'usage.",
        "Suivi des marchands actifs a 7, 30 et 90 jours.",
    ])
    fill_rows(tables[45], [
        "Bujumbura et autres villes selon validation terrain.",
        "Kigali et zones partenaires selon validation.",
        "Kinshasa et corridors prioritaires selon validation.",
        "Zones a fort passage et forte frequence d'encaissement.",
        "Campus et centres de formation.",
        "Cliniques, hopitaux et pharmacies.",
        "Gares, transporteurs, hotels et evenements.",
        "Bureaux legers ; operations soutenues par partenaires.",
        "Avantage : concentrer l'adoption client et marchand dans les memes lieux.",
    ])

    fill_rows(tables[46], [
        "1. Creer le business et valider le KYB.",
        "2. Configurer unite, roles, catalogue, facture ou objet vertical.",
        "3. Creer une commande ou intention de paiement.",
        "4. Client confirme par wallet, QR ou canal active.",
        "5. Ledger, transaction, notification, webhook et rapport sont produits ; reglement et corrections suivent leurs workflows.",
    ])
    supplies = [
        ("Infrastructure cloud et securite", "Fournisseurs cloud et securite a contractualiser", "SLA, sauvegarde, cout mensuel, revue securite", "A definir"),
        ("Paiements et mobile money", "Fournisseurs agrees par pays", "Contrat, API, callbacks, fonds de reserve", "A definir"),
        ("Cartes virtuelles", "Fournisseur d'emission conforme", "Solde fournisseur, devises, securite, support", "A definir"),
        ("Notifications SMS/email/push", "Fournisseurs de messagerie", "Delivrabilite, cout, consentement et langues", "A definir"),
        ("Terminaux et QR", "Fournisseurs de materiel ou impression", "Qualite, livraison, inventaire et remplacement", "A definir"),
        ("Conseil juridique et audit", "Cabinets locaux", "Forfait, delai et livrables", "A definir"),
    ]
    for r, values in enumerate(supplies, start=1):
        for c, value in enumerate(values):
            set_cell(tables[47], r, c, value, size=7.2)
    fill_rows(tables[48], [
        "Equipement informatique securise et gestion des acces.",
        "Connectivite, alimentation de secours et procedures d'incident.",
        "QR visibles et terminaux attribues aux marchands.",
        "Espaces de formation et de support pour equipes pilotes.",
        "Inventaire des terminaux et remplacement documente.",
        "Politique de sauvegarde, journalisation et conservation des preuves.",
        "Aucun investissement immobilier lourd avant validation de l'usage.",
        "Les couts d'amenagement sont fondes sur devis, non sur estimation non verifiee.",
        "Les biens restent traces dans le registre des actifs.",
    ])
    set_cell(tables[49], 0, 0, "Reglementation : LIPAXE doit obtenir ou confirmer toutes les autorisations requises avant de proposer un canal de paiement dans un pays. Les obligations ci-dessous sont une liste de controle et ne constituent pas un avis juridique.")
    permits = [
        ("Etat", "Constitution et immatriculation de LIPAXE SA", "A definir par pays", "", "X"),
        ("Etat", "Qualification et autorisation des services de paiement", "A confirmer", "X", ""),
        ("Etat", "Protection des donnees et conditions utilisateur", "A confirmer", "X", ""),
        ("Local", "Autorisation commerciale, affichage ou point de service", "A confirmer", "X", ""),
        ("Local", "Fiscalite, facturation et obligations de declaration", "A confirmer", "X", ""),
        ("Local", "Contrats operateurs, fournisseurs et marchands", "A confirmer", "X", ""),
    ]
    for r, values in enumerate(permits, start=1):
        for c, value in enumerate(values):
            set_cell(tables[50], r, c, value, size=7.0)
    set_cell(tables[50], 7, 1, "Total")
    set_cell(tables[50], 7, 2, "A confirmer apres avis juridique et devis")

    staffing = [
        ("Produit et technologie", "1", "A definir", "40", "52", "A budgéter"),
        ("Payments operations", "1", "A definir", "40", "52", "A budgéter"),
        ("Finance operations", "1", "A definir", "40", "52", "A budgéter"),
        ("KYB et conformite", "1", "A definir", "40", "52", "A budgéter"),
        ("Ventes marchands", "2", "A definir", "40", "52", "A budgéter"),
        ("Support client et marchand", "1", "A definir", "40", "52", "A budgéter"),
    ]
    for r, values in enumerate(staffing, start=1):
        for c, value in enumerate(values):
            set_cell(tables[51], r, c, value, size=7.0)
    set_cell(tables[51], 7, 0, "Total initial : 7 postes ou roles")
    set_cell(tables[51], 7, 5, "A calculer avec grille salariale locale")
    fill_rows(tables[52], [
        "Annee 2 : commerciaux terrain, support et operations selon marchands actifs.",
        "Annee 2 : analyste risque ou data selon volume et alertes.",
        "Annee 3 : responsables pays ou clusters selon conformite et rentabilite.",
        "Annee 3 : equipe integrations et partenaires selon verticals.",
        "Chaque recrutement est conditionne a un budget, un role et une separation de taches.",
        "Les salaires et qualifications sont definis pays par pays.",
    ])
    fill_rows(tables[53], [
        "Recrutement local prioritaire pour ventes, support, operations et langues.",
        "Formation interne obligatoire pour securite, KYB, fraude et support.",
        "Experts externes cibles pour droit, audit, treasury et securite.",
        "Documentation des procedures pour reduire la dependance aux individus.",
        "Evaluation des acces et permissions avant prise de poste.",
    ])
    fill_rows(tables[54], [
        "Partenariats universitaires et incubateurs.",
        "Reseaux professionnels et programmes emploi.",
        "Prestataires de formation certifies.",
        "Aucune subvention n'est incluse sans confirmation ecrite.",
    ])
    fill_rows(tables[55], [
        "Onboarding produit et environnement marchand.",
        "Securite, mots de passe, acces et gestion des incidents.",
        "KYB/KYC, protection des donnees et prevention de fraude.",
        "Support client, escalation et communication multilingue.",
        "Finance operations, reconciliation et interdiction des manipulations manuelles de solde.",
        "Formation specifique au secteur : caisse, billetterie, education, sante ou transport.",
        "Recyclage periodique et controle des connaissances.",
    ])
    fill_rows(tables[56], [
        "Renfort commercial et support au lancement.",
        "Renfort evenementiel lors des festivals et grands rassemblements.",
        "Renfort education pour les rentrees et paiements de frais.",
        "Renfort transport et tourisme selon saison.",
        "Droits d'acces minimaux et expiration des comptes temporaires.",
        "Supervision par un responsable permanent.",
        "Planification basee sur les donnees de volume et tickets support.",
        "Aucun acces financier privilegie sans validation.",
        "Bilan apres chaque periode de pointe.",
    ])

    # Tables financieres: they must retain the template, but their numbers cannot
    # be fabricated. We record the appropriate model inputs and decision gates.
    set_cell(tables[57], 3, 0, "Service 1 - Commissions d'acceptation")
    set_cell(tables[57], 4, 0, "Volume de transactions par mois")
    set_cell(tables[57], 5, 0, "Taux net par transaction")
    set_cell(tables[57], 6, 0, "Revenu de commissions")
    set_cell(tables[57], 7, 0, "Service 2 - Abonnements marchands")
    set_cell(tables[57], 8, 0, "Marchands abonnés actifs")
    set_cell(tables[57], 9, 0, "Prix moyen par business")
    set_cell(tables[57], 10, 0, "Revenu abonnements")
    set_cell(tables[57], 11, 0, "Service 3 - Onboarding, terminaux et integrations")
    set_cell(tables[57], 12, 0, "Nombre de services factures")
    set_cell(tables[57], 13, 0, "Prix moyen")
    set_cell(tables[57], 14, 0, "Revenu services")
    for c in range(1, 25):
        if c % 2:
            set_cell(tables[57], 3, c, "Hypothese pilote")
            set_cell(tables[57], 7, c, "Hypothese pilote")
            set_cell(tables[57], 11, c, "Hypothese pilote")
    set_cell(tables[57], 16, 0, "Total ventes - a renseigner depuis le modele financier approuve")

    for row, label in {
        3: "Commissions : volume traite",
        4: "Cout fournisseur par transaction",
        5: "Support et operations variables",
        6: "Fraude, litiges et refunds attendus",
        9: "Cout total par transaction",
        11: "Abonnements : businesses actifs",
        12: "Cout d'hebergement et support par business",
        13: "Onboarding et terminaux",
        14: "Cout fournisseur / logistique",
        16: "Cout total services",
        17: "Cout des produits et services vendus",
    }.items():
        set_cell(tables[58], row, 0, label)
    for row, label in {
        4: "Formation des equipes",
        5: "Espaces, logistique et connectivite",
        6: "Cloud, telecoms et outils",
        7: "Fournitures et operations",
        8: "Maintenance, securite et audit",
        9: "Deplacements terrain",
        10: "Partenariats et ventes",
        11: "Juridique, comptabilite et conformite",
        12: "Promotion et activation",
        13: "Assurance et reserves operationnelles",
        15: "Commissions partenaires",
        16: "Primes commerciales",
        17: "Acquisition marchands",
        18: "Maintenance terminaux",
        19: "Autres charges documentees",
    }.items():
        set_cell(tables[59], row, 0, label)
    for c in range(1, 14):
        set_cell(tables[59], 20, c, "Modele financier")

    set_cell(tables[60], 3, 0, "Ordinateurs et equipement securise")
    set_cell(tables[60], 4, 0, "Terminaux, QR et materiel marchand")
    set_cell(tables[60], 5, 0, "Outils de connectivite et alimentation de secours")
    set_cell(tables[60], 6, 0, "Logiciels, licences et securite")
    set_cell(tables[60], 7, 0, "A renseigner apres devis et politique d'amortissement")

    t61 = tables[61]
    set_cell(t61, 3, 0, "Apport fondateur - a confirmer")
    set_cell(t61, 4, 0, "Apport cofondateur ou investisseur - a confirmer")
    set_cell(t61, 5, 0, "Apport en nature : logiciel, documentation, propriete intellectuelle - a valoriser")
    set_cell(t61, 6, 0, "Partenariats ou services credits - a confirmer")
    set_cell(t61, 7, 0, "Ligne court terme uniquement apres plan de tresorerie")
    set_cell(t61, 8, 0, "Financement long terme ou equity - a confirmer")
    set_cell(t61, 9, 0, "Autres : subvention ou programme, non incluse sans accord ecrit")
    set_cell(t61, 10, 0, "Total sources - a equilibrer avec utilisation")
    for r, label in {
        13: "Infrastructure et hebergement",
        14: "Configuration des environnements et securite",
        15: "Equipements, terminaux et QR",
        16: "Fonds de roulement et reserves de liquidite",
        17: "Formation, support et onboarding marchand",
        18: "Fournisseurs de paiement, cartes et integrations",
        19: "Juridique, KYB, conformite et audit",
        20: "Total utilisation - a equilibrer avec les sources",
    }.items():
        set_cell(t61, r, 0, label)
    set_cell(t61, 25, 0, "Produits : commissions d'acceptation, abonnements, onboarding et services")
    set_cell(t61, 34, 0, "Charges d'exploitation : equipe, cloud, fournisseurs, support, ventes, conformite et reserves")
    for r in range(36, 55):
        if not t61.cell(r, 0).text.strip():
            set_cell(t61, r, 0, "Voir budget detaille")

    t62 = tables[62]
    set_cell(t62, 3, 0, "Tresorerie initiale par devise")
    set_cell(t62, 5, 0, "Encaissements")
    for r, label in {
        6: "Apport et financement confirme",
        7: "Commissions d'acceptation",
        8: "Abonnements marchands",
        9: "Onboarding, terminaux et integrations",
        10: "Autres encaissements confirmes",
        14: "Infrastructure et fournisseurs",
        15: "Equipe et support",
        16: "Ventes, formation et deplacements",
        17: "Juridique, conformite et audit",
        18: "Reserves et autres decaissements",
    }.items():
        set_cell(t62, r, 0, label)
    for r in [3, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22]:
        for c in range(1, 14):
            if not t62.cell(r, c).text.strip():
                set_cell(t62, r, c, "A renseigner")

    t63 = tables[63]
    set_cell(t63, 2, 1, "A la date de lancement pilote")
    assets = {
        6: ("Tresorerie et reserves par devise", "A renseigner"),
        7: ("Creances marchandes et fournisseurs", "A renseigner"),
        8: ("Frais prepayes et depots", "A renseigner"),
        9: ("Autres actifs circulants", "A renseigner"),
        10: ("Total des actifs circulants", "A calculer"),
        13: ("Equipement informatique et securite", "A renseigner"),
        14: ("Terminaux et materiel marchand", "A renseigner"),
        15: ("Logiciels et licences", "A renseigner"),
        16: ("Amortissements cumules", "A calculer"),
        17: ("Autres actifs immobilises", "A renseigner"),
        19: ("Actifs immobilises nets", "A calculer"),
        20: ("TOTAL ACTIF", "A calculer"),
        24: ("Fournisseurs et charges a payer", "A renseigner"),
        25: ("Obligations envers fournisseurs de paiement", "A renseigner"),
        26: ("Autres dettes a court terme", "A renseigner"),
        27: ("Total dettes a court terme", "A calculer"),
        29: ("Emprunts ou financement long terme", "A renseigner"),
        30: ("Autres dettes long terme", "A renseigner"),
        31: ("Total dettes long terme", "A calculer"),
        33: ("TOTAL DETTES", "A calculer"),
        34: ("CAPITAUX PROPRES", "Apport et resultat cumule"),
        35: ("TOTAL PASSIF", "A calculer"),
    }
    for r, (label, value) in assets.items():
        set_cell(t63, r, 0, label)
        set_cell(t63, r, 1, value)


def apply_drc_questionnaire_alignment(doc):
    """Overlay the template with the verified D&B facts and a RDC-only scope."""
    tables = doc.tables

    # Cover and executive summary.
    fill_rows(tables[1], [
        "Prince Nzela Muloko - Fondateur, Président-directeur général",
        "LIPAXE - 45, avenue Roi Baudouin, Q. Cliniques, C. Gombe, Kinshasa, RDC",
        "Site web : lipaxe.com | Coordonnées de contact : voir dossier DUN & BRADSTREET",
    ], start=1)
    fill_rows(tables[2], [
        "Plan d'affaires LIPAXE - République démocratique du Congo",
        "Paiements, portefeuille numérique et système marchand",
        "Version de travail - Septembre 2026",
    ])
    fill_rows(tables[3], [
        "République démocratique du Congo - périmètre exclusif",
        "Pilote Kinshasa : 4-5 septembre 2026, sous conditions de conformité",
        "Document confidentiel",
        "Fondé sur le questionnaire DUN & BRADSTREET complété",
    ])

    t = tables[6]
    set_cell(t, 0, 1, "LIPAXE est une plateforme congolaise de paiements et de gestion marchande. Elle relie le portefeuille des particuliers aux commerces et institutions où ils paient réellement : vente, facture, caisse, scolarité, soins, transport, réservation ou événement.", size=8)
    set_cell(t, 3, 1, "LIPAXE", bold=True)
    set_cell(t, 5, 1, "Prince Nzela Muloko, Fondateur et Président-directeur général ; Iragi Maheshe Rodrigue et Prince Lulenda Crespo, cofondateurs.")
    set_cell(t, 8, 1, "Équipe fondatrice : produit fintech, paiements, logiciel marchand, opérations et partenariats. Les CV, mandats et références sont à joindre au dossier d'investissement.")
    set_cell(t, 12, 1, "45, avenue Roi Baudouin, Quartier Cliniques, Commune de Gombe, Kinshasa, République démocratique du Congo.")
    set_cell(t, 15, 1, "Effectif actuel non communiqué dans le questionnaire. Le pilote RDC mobilise des fonctions produit, opérations paiements, finance, conformité, ventes marchands et support.")
    set_cell(t, 17, 0, "Coût du projet (CDF)")
    set_cell(t, 17, 1, "Financement du projet (CDF)")
    set_cell(t, 18, 0, "Capital social déclaré : CDF 12 500 000. La ventilation du budget doit être validée par devis, plan de trésorerie et politique de réserves.")
    set_cell(t, 18, 1, "Financement initial déclaré : capital libéré CDF 12 500 000. Aucun financement externe n'est retenu sans convention écrite.")
    set_cell(t, 26, 0, "Chiffre d'affaires prévu (CDF) :")
    set_cell(t, 26, 1, "Le questionnaire ne communique pas de ventes historiques. Les revenus prévisionnels RDC seront établis à partir des volumes pilotes, commissions, abonnements marchands et services effectivement activés.")
    set_cell(t, 28, 1, "Lancement pilote à Kinshasa : 4-5 septembre 2026, uniquement après validation technique, conformité, disponibilité des canaux et préparation des premiers marchands.")

    set_cell(tables[7], 0, 0, "Calendrier RDC : le lancement vise Kinshasa. Toute extension hors RDC est volontairement exclue de ce plan et ne pourra être décidée qu'après preuve d'usage, conformité et trésorerie suffisantes.")
    fill_rows(tables[8], [
        "Finaliser la conformité RDC et les responsabilités opérationnelles",
        "Vérifier les intégrations fournisseurs disponibles en RDC : sandbox, production et rapprochement",
        "Achever KYB, contrats pilotes, conditions clients et politique de réserves",
        "Sélectionner les clusters pilotes à Kinshasa et les premiers marchands",
        "Configurer les businesses, unités, catalogues, QR et caisses pilotes",
        "Former les équipes marchandes et le support local",
        "Exécuter les paiements bout en bout et rapprocher chaque écriture",
        "Lancer le pilote avec hypercare",
        "Mesurer usage, échecs, remboursements, litiges et écarts",
        "Stabiliser le pilote Kinshasa avant densification",
        "Étendre à d'autres secteurs et communes de Kinshasa validés",
        "Faire valider l'étude de marché RDC et le modèle financier",
        "Revue de direction : décision d'extension strictement fondée sur les résultats RDC",
    ], column=0, start=1)
    fill_rows(tables[8], [
        "Avant septembre 2026", "Avant septembre 2026", "Avant septembre 2026", "Avant septembre 2026",
        "Semaine de lancement", "Semaine de lancement", "Semaine de lancement", "4-5 septembre 2026",
        "Semaines 1 à 4", "Semaines 1 à 4", "Mois 2 à 4", "Avant tout investissement majeur", "Après le pilote RDC",
    ], column=1, start=1)

    fill_rows(tables[10], [
        "LIPAXE est née d'un constat à Kinshasa : disposer d'un moyen de paiement ne suffit pas si les clients n'ont pas de lieux et de services concrets où l'utiliser.",
        "Le projet rapproche le paiement des opérations du marchand : vente, facture, caisse, stock, billet, réservation, dépense et règlement.",
        "La première phase est volontairement limitée à la RDC afin de maîtriser la conformité, les partenaires, la liquidité et le support.",
        "Le cœur financier est séparé des modules verticaux afin de protéger les transactions et de faciliter les contrôles.",
        "Les activités pilotes visées en RDC comprennent commerce, éducation, santé, transport, hôtellerie, événementiel et services.",
        "Le lancement débute à Kinshasa, par zones et partenaires capables d'être formés et accompagnés.",
        "Les paiements QR et portefeuille sont prioritaires ; le NFC est limité aux appareils mobiles compatibles et aux cas validés.",
        "Chaque mouvement de fonds doit être tracé, rapproché et explicable par l'équipe de contrôle.",
        "La croissance mesure les marchands actifs et les paiements récurrents, non le nombre de comptes ouverts.",
    ])
    fill_rows(tables[15], [
        "Territoire cible exclusif : République démocratique du Congo.",
        "Ville pilote : Kinshasa, avec siège à Gombe.",
        "Approche : lancement par clusters d'usage et partenaires vérifiés.",
        "Zones prioritaires : commerce, campus, santé, transport, hôtellerie et événements.",
        "Bureaux physiques limités ; opérations hybrides et présence terrain à Kinshasa.",
        "Paramètres de devise, de conformité et de fournisseurs configurés spécifiquement pour la RDC.",
        "Les canaux non opérationnels en RDC restent désactivés dans le produit.",
        "La densité de marchands à Kinshasa prévaut sur toute expansion géographique.",
    ])

    # Founders and legal structure from the completed D&B questionnaire.
    set_cell(tables[16], 0, 1, "Prince Nzela Muloko")
    set_cell(tables[16], 1, 1, "À compléter dans le dossier légal")
    set_cell(tables[16], 2, 1, "Fondateur - Président-directeur général")
    set_cell(tables[16], 3, 1, "45, avenue Roi Baudouin, Q. Cliniques, C. Gombe, Kinshasa, RDC")
    set_cell(tables[16], 4, 1, "Coordonnées personnelles conservées dans le dossier légal")
    set_cell(tables[17], 0, 1, "Iragi Maheshe Rodrigue")
    set_cell(tables[17], 1, 1, "À compléter dans le dossier légal")
    set_cell(tables[17], 2, 1, "Cofondateur - produit et écosystème LIPAXE")
    set_cell(tables[17], 3, 1, "Kinshasa, RDC")
    set_cell(tables[17], 4, 1, "Coordonnées personnelles conservées dans le dossier légal")
    fill_rows(tables[20], [
        "Prince Lulenda Crespo - Cofondateur ; rôle opérationnel à préciser dans les mandats.",
        "Prince Nzela Muloko - 40 % du capital déclaré ; Président-directeur général.",
        "Iragi Maheshe Rodrigue - 35 % du capital déclaré ; cofondateur.",
        "Prince Lulenda Crespo - 25 % du capital déclaré ; cofondateur.",
    ])
    set_cell(tables[21], 0, 0, "LIPAXE est enregistrée en République démocratique du Congo sous le RCCM CD/KNG/RCCM/26-A-01283. La forme juridique exacte doit être harmonisée entre le RCCM, les statuts et le questionnaire DUN & BRADSTREET avant diffusion externe.")
    fill_rows(tables[22], [
        "LIPAXE - société enregistrée en République démocratique du Congo",
        "RCCM : CD/KNG/RCCM/26-A-01283 | Année d'établissement : 2026",
        "Capital autorisé, émis et libéré déclaré : CDF 12 500 000",
        "Gouvernance : Président-directeur général, cofondateurs, contrôle finance et conformité ; statuts et délégations à annexer",
    ])
    set_cell(tables[24], 0, 1, "MISE DE FONDS (CDF)")
    owners = [
        ("Prince Nzela Muloko", "5 000 000", "Numéraire / capital déclaré", "40 %"),
        ("Iragi Maheshe Rodrigue", "4 375 000", "Numéraire / capital déclaré", "35 %"),
        ("Prince Lulenda Crespo", "3 125 000", "Numéraire / capital déclaré", "25 %"),
    ]
    for row, values in enumerate(owners, start=2):
        for column, value in enumerate(values):
            set_cell(tables[24], row, column, value)

    fill_rows(tables[25], [
        "Président-directeur général : Prince Nzela Muloko - stratégie, partenariats, budget et gouvernance.",
        "Cofondateurs : pilotage produit, écosystème et responsabilités définies par mandats.",
        "Produit et technologie : feuille de route, architecture, qualité et sécurité applicative.",
        "Opérations paiements : flux, fournisseurs RDC, callbacks et rapprochement.",
        "Finance opérations : réserves, frais, règlements, dépenses et paie.",
        "Risque et conformité : KYB, contrôles, alertes, preuves et escalade.",
        "Commercial marchand : acquisition, onboarding, formation et rétention à Kinshasa.",
        "Support client et marchand : incidents, communication et suivi.",
        "Data et reporting : adoption, finance, risque et qualité de service.",
        "Principe : personne ne peut initier, approuver et payer seule une sortie de fonds.",
        "Principe : les rôles sont vérifiés côté serveur et chaque décision est auditée.",
        "Principe : les modules sectoriels ne modifient jamais directement le cœur de paiement.",
    ])

    # RDC market and operating perimeter.
    fill_rows(tables[28], [
        "Services financiers numériques et logiciel marchand en RDC.",
        "Marché B2C : utilisateurs de portefeuille et payeurs chez les partenaires pilotes.",
        "Marché B2B : marchands, institutions, agents, banques et institutions financières en RDC.",
    ])
    fill_rows(tables[29], [
        "Le secteur RDC combine paiement, distribution, logiciel SaaS et opérations de terrain.",
        "La barrière principale est la confiance : disponibilité, preuve, support, sécurité et conformité.",
        "La valeur augmente avec le nombre de lieux à Kinshasa où le client peut payer utilement.",
        "La valeur augmente avec les modules qui réduisent le travail administratif du marchand.",
        "Le lancement est progressif : fournisseurs RDC, devise, conformité et qualité de service sont validés avant extension.",
    ])
    set_cell(tables[30], 4, 0, "Faiblesses à traiter : marque nouvelle, coût de support, dépendance aux partenaires RDC et nécessité de gagner la confiance de chaque marchand pilote.")
    fill_rows(tables[31], [
        "Paiement numérique et preuve instantanée à Kinshasa.",
        "Digitalisation des PME et des institutions en RDC.",
        "Besoin de reporting, d'audit et de contrôle de caisse.",
        "Croissance des intégrations API et des webhooks avec les entreprises.",
    ])
    set_cell(tables[34], 0, 0, "Analyse de la concurrence RDC : l'étude de marché complète comparera Kinshasa par moyen de paiement, segment marchand, coût de distribution et exigence réglementaire. Les concurrents, prix et parts de marché seront confirmés par enquête terrain avant tout engagement commercial.")
    fill_rows(tables[35], [
        "Opérateurs de mobile money et réseaux d'agents actifs en RDC.",
        "Banques, applications bancaires et solutions d'encaissement en RDC.",
        "Passerelles de paiement et agrégateurs autorisés ou disponibles en RDC.",
        "Solutions de caisse et logiciels de gestion présents à Kinshasa.",
        "Prestataires de cartes et portefeuilles concurrents selon disponibilité RDC.",
        "Intégrateurs locaux et fournisseurs de terminaux à qualifier.",
        "Concurrents directs à identifier et documenter par zone pilote de Kinshasa.",
    ])
    set_cell(tables[39], 1, 0, "Opportunités RDC : digitalisation des PME, besoin de preuve, paiements récurrents dans l'éducation, la santé, le transport et les événements, partenariats sectoriels et densification à Kinshasa.")
    set_cell(tables[39], 1, 1, "Menaces RDC : contraintes réglementaires, indisponibilité fournisseur, fraude, liquidité insuffisante, faible adoption, concurrence et coût de distribution terrain.")
    set_cell(tables[40], 0, 0, "Plan marketing RDC : l'acquisition est pilotée par des usages concrets à Kinshasa, non seulement par la communication. Chaque marchand actif doit donner au client une raison claire d'ouvrir et d'utiliser son portefeuille LIPAXE.")
    fill_rows(tables[43], [
        "Démonstrations terrain et onboarding des marchands pilotes à Kinshasa.",
        "Partenariats RDC avec écoles, santé, commerce, transport et organisateurs d'événements.",
        "Communication QR au point de vente, tutoriels client et reçu transactionnel.",
        "Contenu digital, référencement public, réseaux sociaux et support de proximité en RDC.",
    ])
    fill_rows(tables[45], [
        "Kinshasa - ville pilote et siège à Gombe.",
        "Communes et clusters définis à partir de l'enquête terrain.",
        "Zones à fort passage et forte fréquence d'encaissement.",
        "Campus et centres de formation.",
        "Cliniques, hôpitaux et pharmacies.",
        "Gares, transporteurs, hôtels et événements.",
        "Bureaux légers ; opérations soutenues par partenaires locaux.",
        "Avantage : concentrer l'adoption client et marchand dans les mêmes lieux.",
        "Extension vers d'autres villes RDC uniquement après validation du pilote Kinshasa.",
    ])

    # Compliance and financial information that are confirmed rather than invented.
    set_cell(tables[49], 0, 0, "Réglementation RDC : LIPAXE doit confirmer toutes les autorisations applicables avant l'activation d'un canal de paiement. Cette liste de contrôle ne constitue pas un avis juridique et ne prétend pas qu'une autorisation a déjà été obtenue.")
    permits = [
        ("RDC", "Constitution, RCCM et documents de gouvernance LIPAXE", "CD/KNG/RCCM/26-A-01283", "", "X"),
        ("RDC", "Qualification / autorisation des services de paiement", "À confirmer avec conseil compétent", "X", ""),
        ("RDC", "Protection des données et conditions utilisateur", "À confirmer", "X", ""),
        ("RDC", "Fiscalité, facturation et obligations déclaratives", "À confirmer", "X", ""),
        ("RDC", "Contrats fournisseurs, marchands et conservation des preuves", "À confirmer", "X", ""),
        ("RDC", "KYB/KYC, lutte contre la fraude et signalement selon obligations", "À confirmer", "X", ""),
    ]
    for row, values in enumerate(permits, start=1):
        for column, value in enumerate(values):
            set_cell(tables[50], row, column, value, size=7.0)
    set_cell(tables[50], 7, 1, "Total")
    set_cell(tables[50], 7, 2, "RDC : validation juridique et coûts à obtenir avant le lancement")

    for column in range(1, 25):
        if column % 2:
            set_cell(tables[57], 3, column, "Hypothèse pilote RDC")
            set_cell(tables[57], 7, column, "Hypothèse pilote RDC")
            set_cell(tables[57], 11, column, "Hypothèse pilote RDC")
    set_cell(tables[57], 16, 0, "Total ventes RDC - à renseigner depuis le modèle financier approuvé")

    t61 = tables[61]
    set_cell(t61, 3, 0, "Capital social libéré déclaré - Prince Nzela Muloko")
    set_cell(t61, 3, 2, "5 000 000")
    set_cell(t61, 4, 0, "Capital social libéré déclaré - Iragi Maheshe Rodrigue")
    set_cell(t61, 4, 2, "4 375 000")
    set_cell(t61, 5, 0, "Capital social libéré déclaré - Prince Lulenda Crespo")
    set_cell(t61, 5, 2, "3 125 000")
    set_cell(t61, 10, 0, "Total sources confirmées - capital social déclaré RDC")
    set_cell(t61, 10, 2, "12 500 000")
    set_cell(t61, 20, 0, "Total utilisation - ventilation CDF à valider par devis et budget détaillé")
    set_cell(tables[62], 3, 0, "Trésorerie initiale RDC par devise")
    set_cell(tables[63], 2, 1, "À la date de lancement pilote RDC")


def format_cdf(amount):
    return f"{amount:,.0f}".replace(",", " ")


def set_monthly_values(table, row, values, columns, total_column, total=None, size=7.2):
    for column, value in zip(columns, values):
        set_cell(table, row, column, format_cdf(value), size=size)
    set_cell(table, row, total_column, format_cdf(sum(values) if total is None else total), size=size)


def apply_dnb_v4_alignment(doc):
    """Apply the newer completed DUN & BRADSTREET v4 questionnaire."""
    tables = doc.tables

    # Corporate facts from v4 supersede the earlier questionnaire.
    t = tables[6]
    set_cell(t, 5, 1, "Prince Muloko, CEO et cofondateur ; Iragi Rodrigue Maheshe, PCA et cofondateur ; Stephano CND, cofondateur.")
    set_cell(t, 15, 1, "Effectif déclaré : 3 personnes au siège et 6 personnes au total. Le plan de recrutement complète ces fonctions selon l'activité du pilote RDC.")
    set_cell(t, 18, 0, "Capital autorisé et émis déclaré : CDF 83 335 000. Le questionnaire DUN & BRADSTREET v4 indique que le capital n'est pas encore libéré.")
    set_cell(t, 18, 1, "Les investissements et le fonds de roulement prévisionnels ne peuvent être engagés qu'après libération effective du capital ou financement documenté.")
    set_cell(t, 26, 1, "Ventes déclarées dans le questionnaire : CDF 5 000 000 pour l'année précédente et CDF 6 135 000 pour l'année courante. Les tableaux financiers ci-dessous présentent le scénario pilote RDC correspondant.")

    set_cell(tables[16], 0, 1, "Prince Muloko")
    set_cell(tables[16], 2, 1, "CEO - cofondateur")
    set_cell(tables[17], 0, 1, "Iragi Rodrigue Maheshe")
    set_cell(tables[17], 2, 1, "PCA - cofondateur")
    fill_rows(tables[20], [
        "Stephano CND - Cofondateur ; responsabilités opérationnelles à préciser dans les mandats.",
        "Prince Muloko - 40 % du capital autorisé et émis déclaré ; CEO.",
        "Iragi Rodrigue Maheshe - 40 % du capital autorisé et émis déclaré ; PCA.",
        "Stephano CND - 20 % du capital autorisé et émis déclaré ; cofondateur.",
    ])
    set_cell(tables[21], 0, 0, "LIPAXE est une SA enregistrée en République démocratique du Congo sous le RCCM CD/KNG/RCCM/26-A-01283, en date du 18 mars 2026. Les statuts, la libération du capital et les délégations de pouvoirs doivent être tenus à jour dans le dossier légal.")
    fill_rows(tables[22], [
        "LIPAXE SA - République démocratique du Congo",
        "RCCM : CD/KNG/RCCM/26-A-01283 | Date d'enregistrement : 18 mars 2026",
        "Capital autorisé et émis : CDF 83 335 000 | Capital libéré : non libéré selon le questionnaire v4",
        "Gouvernance : CEO, PCA, cofondateurs, contrôle financier et conformité ; décisions et délégations documentées",
    ])
    owners = [
        ("Prince Muloko", "33 334 000", "Capital souscrit, à libérer", "40 %"),
        ("Iragi Rodrigue Maheshe", "33 334 000", "Capital souscrit, à libérer", "40 %"),
        ("Stephano CND", "16 667 000", "Capital souscrit, à libérer", "20 %"),
    ]
    for row, values in enumerate(owners, start=2):
        for column, value in enumerate(values):
            set_cell(tables[24], row, column, value)

    fill_rows(tables[25], [
        "CEO : Prince Muloko - stratégie, partenariats, budget et gouvernance.",
        "PCA : Iragi Rodrigue Maheshe - gouvernance, produit et écosystème LIPAXE.",
        "Cofondateur : Stephano CND - responsabilités définies par mandat et plan de travail.",
        "Produit et technologie : feuille de route, architecture, qualité et sécurité applicative.",
        "Opérations paiements : flux, fournisseurs RDC, callbacks et rapprochement.",
        "Finance opérations : réserves, frais, règlements, dépenses et paie.",
        "Risque et conformité : KYB, contrôles, alertes, preuves et escalade.",
        "Commercial marchand : acquisition, onboarding, formation et rétention à Kinshasa.",
        "Support client et marchand : incidents, communication et suivi.",
        "Data et reporting : adoption, finance, risque et qualité de service.",
        "Principe : personne ne peut initier, approuver et payer seule une sortie de fonds.",
        "Principe : les rôles sont vérifiés côté serveur et chaque décision est auditée.",
    ])
    set_cell(tables[26], 1, 1, "Rawbank - siège, Gombe, Kinshasa")
    set_cell(tables[26], 2, 1, "Equity Bank - siège, boulevard du 30 Juin, Gombe, Kinshasa")
    set_cell(tables[26], 3, 1, "Conseil juridique fintech RDC à désigner")
    set_cell(tables[26], 4, 1, "Auditeur et cabinet comptable à désigner")
    set_cell(tables[26], 5, 1, "Assurance cyber, responsabilité professionnelle et actifs à contractualiser")

    # The v4 questionnaire declares six staff and current/previous annual sales.
    set_cell(tables[51], 7, 0, "Effectif déclaré : 6 personnes ; scénario pilote : répartition par fonctions à confirmer")
    set_cell(tables[52], 0, 0, "Année 2 : renfort commercial, support et opérations selon le nombre de marchands actifs.")
    set_cell(tables[52], 1, 0, "Année 2 : analyste risque et conformité selon les volumes et alertes.")
    set_cell(tables[52], 2, 0, "Année 3 : responsables de clusters RDC et équipe intégrations selon rentabilité.")
    set_cell(tables[52], 3, 0, "Année 3 : consolidation des fonctions finance, audit et support.")

    # Scenario pilote RDC sur 12 mois. It is a management forecast, not a restatement.
    p1_units = [120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 420, 450]
    p2_units = [5, 5, 7, 7, 8, 8, 10, 10, 12, 12, 18, 18]
    p3_units = [1] * 12
    p1_sales = [units * 500 for units in p1_units]
    p2_sales = [units * 20_000 for units in p2_units]
    p3_sales = [units * 150_000 for units in p3_units]
    revenue = [a + b + c for a, b, c in zip(p1_sales, p2_sales, p3_sales)]
    p1_cost = [units * 250 for units in p1_units]
    p2_cost = [units * 5_000 for units in p2_units]
    cogs = [a + b for a, b in zip(p1_cost, p2_cost)]

    fixed_rows = {
        4: [60_000, 60_000] + [0] * 10,
        5: [50_000] * 12,
        6: [30_000] * 12,
        7: [10_000] * 12,
        8: [10_000] * 12,
        9: [0] * 12,
        10: [20_000] * 12,
        11: [15_000] * 12,
        12: [30_000] * 12,
        13: [5_000] * 12,
    }
    variable_rows = {
        15: [25_000] * 12,
        16: [10_000] * 12,
        17: [20_000] * 12,
        18: [5_000] * 12,
        19: [205_000] * 12,  # Indemnités de lancement et support de l'équipe de six personnes.
    }
    charges = [sum(month) for month in zip(*list(fixed_rows.values()) + list(variable_rows.values()))]

    t57 = tables[57]
    revenue_columns = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
    set_cell(t57, 3, 0, "Commissions d'acceptation")
    set_monthly_values(t57, 4, p1_units, revenue_columns, 24, size=7.0)
    set_monthly_values(t57, 5, [500] * 12, revenue_columns, 24, total=500, size=7.0)
    set_monthly_values(t57, 6, p1_sales, revenue_columns, 24, size=7.0)
    set_cell(t57, 7, 0, "Abonnements marchands")
    set_monthly_values(t57, 8, p2_units, revenue_columns, 24, size=7.0)
    set_monthly_values(t57, 9, [20_000] * 12, revenue_columns, 24, total=20_000, size=7.0)
    set_monthly_values(t57, 10, p2_sales, revenue_columns, 24, size=7.0)
    set_cell(t57, 11, 0, "Onboarding et intégrations")
    set_monthly_values(t57, 12, p3_units, revenue_columns, 24, size=7.0)
    set_monthly_values(t57, 13, [150_000] * 12, revenue_columns, 24, total=150_000, size=7.0)
    set_monthly_values(t57, 14, p3_sales, revenue_columns, 24, size=7.0)
    set_monthly_values(t57, 16, revenue, revenue_columns, 24, size=7.0)

    t58 = tables[58]
    months14 = list(range(1, 13))
    set_monthly_values(t58, 3, p1_units, months14, 13, size=7.0)
    set_monthly_values(t58, 4, [200] * 12, months14, 13, total=200, size=7.0)
    set_monthly_values(t58, 5, [50] * 12, months14, 13, total=50, size=7.0)
    set_monthly_values(t58, 6, [0] * 12, months14, 13, total=0, size=7.0)
    set_monthly_values(t58, 9, [0] * 12, months14, 13, total=0, size=7.0)
    set_monthly_values(t58, 10, [250] * 12, months14, 13, total=250, size=7.0)
    set_monthly_values(t58, 11, p2_units, months14, 13, size=7.0)
    set_monthly_values(t58, 12, [2_000] * 12, months14, 13, total=2_000, size=7.0)
    set_monthly_values(t58, 13, [3_000] * 12, months14, 13, total=3_000, size=7.0)
    set_monthly_values(t58, 14, [0] * 12, months14, 13, total=0, size=7.0)
    set_monthly_values(t58, 16, [5_000] * 12, months14, 13, total=5_000, size=7.0)
    set_monthly_values(t58, 17, cogs, months14, 13, size=7.0)

    t59 = tables[59]
    for row, values in {**fixed_rows, **variable_rows}.items():
        set_monthly_values(t59, row, values, months14, 13, size=7.0)
    set_cell(t59, 19, 0, "Indemnités de lancement et support de l'équipe")
    set_monthly_values(t59, 20, charges, months14, 13, size=7.0)

    # Sources, use of funds and depreciation are disclosed as a planned scenario.
    t60 = tables[60]
    equipment = [
        (3, "Ordinateurs sécurisés (5)", 7_500_000, "09/2026", 36, 208_333, "08/2029"),
        (4, "Terminaux, QR et équipements marchands", 4_500_000, "09/2026", 36, 125_000, "08/2029"),
        (5, "Logiciels, licences et sécurité", 8_000_000, "09/2026", 36, 222_222, "08/2029"),
    ]
    for row, name, cost, date, months, depreciation, end in equipment:
        for column, value in enumerate([name, format_cdf(cost), date, str(months), format_cdf(depreciation), end]):
            set_cell(t60, row, column, value, size=7.0)

    t61 = tables[61]
    source_rows = [
        (3, "Capital souscrit par Prince Muloko - à libérer", 33_334_000),
        (4, "Capital souscrit par Iragi Rodrigue Maheshe - à libérer", 33_334_000),
        (5, "Capital souscrit par Stephano CND - à libérer", 16_667_000),
        (6, "Apport en nature : logiciel et documentation - inclus dans le plan", 0),
        (7, "Emprunt bancaire à court terme", 0),
        (8, "Emprunt bancaire à long terme", 0),
        (9, "Autres financements confirmés", 0),
    ]
    for row, label, amount in source_rows:
        set_cell(t61, row, 0, label)
        set_cell(t61, row, 2, format_cdf(amount))
    set_cell(t61, 10, 0, "Total des sources prévues - conditionné à la libération du capital")
    set_cell(t61, 10, 2, "83 335 000")
    use_rows = [
        (13, "Terrain", 0),
        (14, "Bâtiments", 0),
        (15, "Équipements et terminaux", 12_000_000),
        (16, "Stock", 0),
        (17, "Logiciels, sécurité, mobilier et configuration", 16_000_000),
        (18, "Fonds de roulement et réserves de liquidité", 55_335_000),
        (19, "Petit matériel, QR et support terrain", 0),
    ]
    for row, label, amount in use_rows:
        set_cell(t61, row, 0, label)
        set_cell(t61, row, 2, format_cdf(amount))
    set_cell(t61, 20, 0, "Total utilisation prévisionnelle RDC")
    set_cell(t61, 20, 2, "83 335 000")

    results_columns = list(range(2, 14))
    total_column = 14
    gross_margin = [sale - cost for sale, cost in zip(revenue, cogs)]
    monthly_depreciation = [555_555] * 11 + [555_561]
    operating_expenses = [charge + depreciation for charge, depreciation in zip(charges, monthly_depreciation)]
    result_before_tax = [gross - expense for gross, expense in zip(gross_margin, operating_expenses)]
    tax = [0] * 12
    result_after_tax = [before - current_tax for before, current_tax in zip(result_before_tax, tax)]
    for row, values in {
        26: revenue, 27: cogs, 28: gross_margin, 30: revenue, 31: cogs, 32: gross_margin,
        35: [sum(values) for values in zip(*fixed_rows.values())],
        36: variable_rows[19], 41: monthly_depreciation,
        42: [sum(values) for key, values in variable_rows.items() if key != 19],
        51: operating_expenses, 52: result_before_tax, 53: tax, 54: result_after_tax, 55: operating_expenses,
    }.items():
        set_monthly_values(t61, row, values, results_columns, total_column, size=6.8)
    for row in (29, 33):
        for column in results_columns:
            set_cell(t61, row, column, "74,45 %", size=6.8)
        set_cell(t61, row, total_column, "74,45 %", size=6.8)
    set_cell(t61, 35, 0, "Charges fixes")
    set_cell(t61, 36, 0, "Indemnités de lancement et support")
    set_cell(t61, 41, 0, "Amortissements")
    set_cell(t61, 42, 0, "Charges variables hors indemnités")
    set_cell(t61, 51, 0, "Total charges d'exploitation")
    set_cell(t61, 52, 0, "Résultat net avant impôt")
    set_cell(t61, 53, 0, "Impôt sur le résultat")
    set_cell(t61, 54, 0, "Résultat net après impôt")

    # Cash flow uses cash charges; depreciation is deliberately excluded.
    t62 = tables[62]
    cash_start = 55_335_000
    cash_open = []
    cash_close = []
    running_cash = cash_start
    for sale, cost, charge in zip(revenue, cogs, charges):
        cash_open.append(running_cash)
        running_cash += sale - cost - charge
        cash_close.append(running_cash)
    cash_rows = {
        3: cash_open,
        6: [0] * 12,
        7: p1_sales,
        8: p2_sales,
        9: p3_sales,
        10: [0] * 12,
        11: revenue,
        14: cogs,
        15: [sum(values) for values in zip(*fixed_rows.values())],
        16: [sum(variable_rows[row][month] for row in (15, 16, 17, 18)) for month in range(12)],
        17: [0] * 12,
        18: variable_rows[19],
        19: [cost + charge for cost, charge in zip(cogs, charges)],
        20: [sale - cost - charge for sale, cost, charge in zip(revenue, cogs, charges)],
        21: [0] * 12,
        22: cash_close,
    }
    for row, values in cash_rows.items():
        set_monthly_values(t62, row, values, months14, 13, total=(cash_close[-1] if row == 22 else sum(values)), size=7.0)
    set_cell(t62, 3, 0, "Trésorerie initiale après investissements planifiés")
    set_cell(t62, 6, 0, "Capital à libérer durant l'exercice")
    set_cell(t62, 15, 0, "Équipe, support et charges fixes")
    set_cell(t62, 16, 0, "Ventes, formation et déplacements")
    set_cell(t62, 17, 0, "Juridique, conformité et audit")
    set_cell(t62, 18, 0, "Indemnités de lancement et autres décaissements")

    t63 = tables[63]
    set_cell(t63, 2, 1, "Scénario d'ouverture RDC après libération du capital")
    balance_rows = {
        6: ("Trésorerie et réserves de liquidité", 55_335_000),
        7: ("Créances marchandes et fournisseurs", 0),
        8: ("Frais prépayés et dépôts", 0),
        9: ("Autres actifs circulants", 0),
        10: ("Total des actifs circulants", 55_335_000),
        13: ("Ordinateurs sécurisés", 7_500_000),
        14: ("Terminaux, QR et matériel marchand", 4_500_000),
        15: ("Logiciels, licences et sécurité", 8_000_000),
        16: ("Amortissements cumulés", 0),
        17: ("Mobilier, configuration et autres immobilisations", 8_000_000),
        19: ("Actifs immobilisés nets", 28_000_000),
        20: ("TOTAL ACTIF", 83_335_000),
        24: ("Fournisseurs et charges à payer", 0),
        25: ("Obligations envers fournisseurs de paiement", 0),
        26: ("Autres dettes à court terme", 0),
        27: ("Total dettes à court terme", 0),
        29: ("Emprunts ou financement long terme", 0),
        30: ("Autres dettes long terme", 0),
        31: ("Total dettes long terme", 0),
        33: ("TOTAL DETTES", 0),
        34: ("CAPITAUX PROPRES - capital souscrit à libérer", 83_335_000),
        35: ("TOTAL PASSIF", 83_335_000),
    }
    for row, (label, amount) in balance_rows.items():
        set_cell(t63, row, 0, label)
        set_cell(t63, row, 1, format_cdf(amount))


def build():
    doc = Document(SOURCE)
    replace_paragraphs(doc)
    fill_tables(doc)
    apply_drc_questionnaire_alignment(doc)
    apply_dnb_v4_alignment(doc)
    for section in doc.sections:
        for paragraph in section.footer.paragraphs:
            if not paragraph.text.strip():
                set_paragraph(paragraph, "LIPAXE | Plan d'affaires RDC | Septembre 2026", size=8)
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.core_properties.title = "Plan d'affaires LIPAXE - RDC"
    doc.core_properties.subject = "Paiements et système marchand en République démocratique du Congo"
    doc.core_properties.author = "LIPAXE"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
