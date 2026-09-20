from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


OUTPUT = Path(r"C:\Users\Rodrigue\Documents\lipax docs\Plan d'affaires LIPAXE actualise 2026.docx")


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), fill)
    tc_pr.append(shading)


def set_cell_margins(cell, top=120, start=120, bottom=120, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    marker = OxmlElement("w:tblHeader")
    marker.set(qn("w:val"), "true")
    tr_pr.append(marker)


def set_cell_text(cell, text, bold=False, color="1A1A1A", size=9):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(text))
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_margins(cell)


def configure_document(doc):
    section = doc.sections[0]
    section.top_margin = Cm(2.1)
    section.bottom_margin = Cm(1.9)
    section.left_margin = Cm(2.1)
    section.right_margin = Cm(2.1)

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(28, 38, 34)
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.18

    title = doc.styles["Title"]
    title.font.name = "Aptos Display"
    title._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    title._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    title.font.size = Pt(31)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(12)

    for name, size in (("Heading 1", 20), ("Heading 2", 14), ("Heading 3", 11)):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_before = Pt(16 if name == "Heading 1" else 11)
        style.paragraph_format.space_after = Pt(7)
        style.paragraph_format.keep_with_next = True

    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.text = "LIPAXE  |  Plan d'affaires actualise 2026  |  Document de travail confidentiel"
    for run in p.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(105, 118, 110)


def add_title(doc, text, subtitle=None):
    p = doc.add_paragraph(style="Heading 1")
    p.add_run(text)
    if subtitle:
        p = doc.add_paragraph(subtitle)
        p.paragraph_format.space_after = Pt(10)
        for run in p.runs:
            run.italic = True
            run.font.color.rgb = RGBColor(85, 103, 94)


def add_body(doc, *paragraphs):
    for text in paragraphs:
        p = doc.add_paragraph(text)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.add_run(item)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        p.add_run(item)


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = False
    header = table.rows[0]
    set_repeat_table_header(header)
    for index, text in enumerate(headers):
        cell = header.cells[index]
        set_cell_text(cell, text, bold=True, color="FFFFFF", size=8.5)
        set_cell_shading(cell, "075C4E")
        if widths:
            cell.width = Cm(widths[index])
    for row in rows:
        cells = table.add_row().cells
        for index, text in enumerate(row):
            set_cell_text(cells[index], text, size=8.7)
            if widths:
                cells[index].width = Cm(widths[index])
        if len(table.rows) % 2 == 1:
            for cell in cells:
                set_cell_shading(cell, "F2F7F4")
    doc.add_paragraph()
    return table


def add_key_value_table(doc, values):
    rows = [[key, value] for key, value in values]
    return add_table(doc, ["Point", "Contenu"], rows, widths=[4.0, 12.8])


def add_page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def build():
    doc = Document()
    configure_document(doc)

    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Plan d'affaires LIPAXE")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Plateforme de paiements et systeme d'exploitation marchand")
    r.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(7, 92, 78)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Burundi  |  Rwanda  |  Republique democratique du Congo")
    r.font.size = Pt(12)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Version actualisee - Septembre 2026").italic = True
    doc.add_paragraph()
    add_body(
        doc,
        "Ce plan d'affaires actualise le projet LIPAXE autour d'une conviction operationnelle : un moyen de paiement n'a de valeur durable que s'il existe des lieux, des services et des activites ou il est concretement utilise. LIPAXE associe donc une infrastructure de paiement a un systeme marchand qui permet aux entreprises de vendre, facturer, encaisser, gerer leur caisse, leurs produits, leurs clients et leurs equipes.",
        "Le document presente le modele cible, les hypotheses a confirmer sur le terrain et la feuille de route de lancement. Il ne remplace pas l'etude de marche, les autorisations regulatorires, les contrats fournisseurs ni le modele financier detaille. Ces elements restent des conditions de mise en production et de deploiement commercial.",
    )
    add_page_break(doc)

    add_title(doc, "Sommaire")
    add_numbered(doc, [
        "Resume executif",
        "Le changement de vision : du paiement isole au reseau d'usage",
        "Probleme resolu et proposition de valeur",
        "Plateforme LIPAXE et modules marchands",
        "Cas d'usage par secteur d'activite",
        "Marche cible et strategie de lancement",
        "Modele economique et principes tarifaires",
        "Operations, technologie, securite et conformite",
        "Organisation, partenariats et gouvernance",
        "Plan de deploiement a partir de septembre 2026",
        "Indicateurs de pilotage, risques et decisions a prendre",
        "Annexes : hypotheses et questionnaires terrain",
    ])

    add_page_break(doc)
    add_title(doc, "1. Resume executif")
    add_body(
        doc,
        "LIPAXE est une plateforme regionale de services financiers numeriques qui permet aux particuliers et aux entreprises de detenir des wallets, d'effectuer des paiements, d'accepter des paiements, de suivre leurs operations et de recevoir des reglements. La vision actualisee depasse le portefeuille numerique : LIPAXE construit un reseau d'acceptation et un systeme d'exploitation pour les marchands.",
        "Le probleme strategique est simple. Une application de paiement peut etre techniquement excellente et pourtant rester inactive si ses utilisateurs ne savent pas ou payer. De l'autre cote, un marchand n'adopte pas un nouveau moyen de paiement s'il ne resout qu'un encaissement isole et lui impose de gerer ses produits, ses factures, son personnel et sa tresorerie dans d'autres outils. Le module Marchand transforme ce cercle vicieux en boucle de croissance : chaque commerce equipe cree un nouveau usage pour le wallet LIPAXE, et chaque utilisateur actif rend le moyen de paiement plus utile au commerce.",
        "LIPAXE entre donc sur le marche par des activites ayant des encaissements frequents, des files d'attente, des montants repetitifs ou une trace comptable necessaire : commerce de detail, restauration, ecoles, cliniques et hopitaux, transport, hotellerie, evenementiel, services et administrations privees. Chaque vertical utilise le meme coeur de paiement, mais dispose d'outils adaptes a sa realite.",
        "Le lancement commercial doit privilegier un nombre limite de corridors geographiques et de secteurs pilotes. L'objectif initial n'est pas de revendiquer une couverture complete, mais de prouver la qualite de l'encaissement, la fiabilite du rapprochement, l'adoption des marchands et la recurrence des paiements. Le lancement pilote est envisage a compter des 4 et 5 septembre 2026, sous reserve de l'etat des integrations, des autorisations applicables et de la preparation des marchands pilotes.",
    )
    add_key_value_table(doc, [
        ("Mission", "Rendre le paiement numerique utile au quotidien en reliant le wallet des clients aux activites reelles des marchands."),
        ("Produit central", "Un reseau de paiement LIPAXE complete par un systeme marchand modulaire."),
        ("Utilisateurs", "Particuliers, microentreprises, PME, institutions, operateurs de transport, organisateurs d'evenements et commerces multi-sites."),
        ("Territoire prioritaire", "Burundi, Rwanda et RDC avec une approche par villes, corridors et partenaires de distribution."),
        ("Avantage recherche", "Une seule relation de confiance pour vendre, encaisser, comptabiliser, notifier et regler."),
        ("Principale condition de succes", "Atteindre une densite d'acceptation marchande suffisante avant de chercher une expansion geographique large."),
    ])

    add_title(doc, "2. Le changement de vision")
    add_body(
        doc,
        "La premiere vision de LIPAXE pouvait etre formulee comme la mise a disposition de wallets, transferts, cartes, paiements QR, NFC et services financiers digitaux. Cette vision reste necessaire, mais elle ne suffit pas a produire une adoption durable. La question decisive est celle de l'usage : ou le client paie-t-il avec LIPAXE, quel probleme le marchand resout-il, et pourquoi les deux parties reviennent-elles le lendemain ?",
        "La nouvelle formulation est la suivante : LIPAXE est une infrastructure de paiement reliee a un systeme d'exploitation marchand. Le paiement n'est pas une fin ; il est l'evenement financier qui relie une vente, une facture, un billet, une consultation, un trajet, une chambre, un produit ou une paie a une ecriture fiable et a une relation client.",
        "Cette formulation change les priorites produit. Le succes ne se mesure plus seulement au nombre de wallets crees ou de tokens emis. Il se mesure aussi au nombre de points de vente actifs, a la frequence des encaissements, au taux de transactions reussies, au nombre de clients recurrents chez les marchands et a la qualite des reglements et rapprochements.",
    )
    add_table(doc, ["Question strategique", "Reponse LIPAXE avant", "Reponse LIPAXE actualisee"], [
        ("Pourquoi un utilisateur garde-t-il un wallet actif ?", "Pour envoyer ou recevoir de l'argent.", "Pour payer chaque jour chez des marchands, pour un transport, une facture, un evenement ou un service."),
        ("Pourquoi un marchand accepte-t-il LIPAXE ?", "Pour ajouter un moyen de paiement.", "Pour encaisser, facturer, suivre ses ventes, ses produits, sa caisse, son equipe et ses reglements."),
        ("Comment creer la confiance ?", "Par la securite du wallet.", "Par la securite du wallet, des preuves de paiement, du rapprochement, des recus et du support marchand."),
        ("Comment accelerer l'adoption ?", "Par la promotion de l'application.", "Par une acquisition coordonnee de marchands, partenaires et clients dans des zones et usages precis."),
    ], widths=[4.4, 6.0, 6.4])

    add_title(doc, "3. Probleme resolu et proposition de valeur")
    add_body(
        doc,
        "Les paiements du quotidien restent souvent fragmentes entre cash, mobile money, comptes bancaires, carnets papier, fichiers personnels et messages non rapproches. Cette fragmentation genere des erreurs de caisse, des difficultes de preuve, des retards de paiement, une faible visibilite sur les ventes et un cout de gestion eleve.",
        "Pour les particuliers, la valeur est de pouvoir payer rapidement, recevoir une confirmation, retrouver une transaction et utiliser le meme compte dans plusieurs activites. Pour les marchands, la valeur est de disposer d'un environnement de gestion relie a l'encaissement. Pour les institutions, la valeur est de tracer les paiements, d'automatiser la facturation et de reduire les reconciliations manuelles.",
    )
    add_table(doc, ["Partie prenante", "Probleme prioritaire", "Reponse LIPAXE"], [
        ("Client", "Payer sans preuve claire ou sans savoir si le marchand accepte son moyen de paiement.", "Wallet, QR, paiement mobile compatible, historique, recu et notification."),
        ("Petit commerce", "Encaissements disperses et absence de suivi simple des produits et de la caisse.", "Catalogue, caisse, stock, QR de paiement, transactions et cloture de session."),
        ("Institution", "Factures, frais et paiements difficiles a rapprocher a grande echelle.", "Comptes clients, factures, echeances, rapports et exports."),
        ("Operateur multi-sites", "Peu de visibilite sur les ventes par agence, caisse ou equipe.", "Unites de business, roles, terminaux, tableaux de bord et journal d'audit."),
    ], widths=[3.1, 6.1, 7.6])

    add_page_break(doc)
    add_title(doc, "4. Produits et services offerts")
    add_body(
        doc,
        "LIPAXE est organise autour d'un coeur commun et de modules adaptes aux secteurs. Le coeur commun garantit que les paiements, identites, permissions, notifications, preuves et ecritures suivent des regles coherentes. Les modules verticaux ajoutent les objets que le marchand utilise reellement dans son metier.",
    )
    add_table(doc, ["Domaine", "Fonctions", "Valeur commerciale"], [
        ("Wallet et compte utilisateur", "Comptes, devises, solde, transferts, notifications et historique.", "Base de la relation client et du paiement reutilisable."),
        ("Acceptation de paiement", "Intentions de paiement, QR, NFC selon appareil compatible, terminaux, recu et statut.", "Encaisser avec une preuve et un statut immediat."),
        ("Commerce", "Clients, catalogue, commandes, factures, abonnements, rendez-vous et fidelite.", "Transformer chaque paiement en operation commerciale tracee."),
        ("Marchand", "KYB, business, unites, roles, equipe, webhooks, reglages et tableaux de bord.", "Donner a l'entreprise un espace de gestion professionnel."),
        ("Finance operations", "Fournisseurs, depenses, employes, paie et approbations.", "Controler les sorties de fonds et les responsabilites."),
        ("Ledger et reglements", "Ecritures idempotentes, rapprochement, frais, reglements et exports.", "Eviter les doubles mouvements et rendre les fonds auditables."),
        ("Conformite", "Journal d'audit, KYB, preuves, alertes et gestion des incidents.", "Rendre l'expansion compatible avec les exigences de risque et de confiance."),
    ], widths=[3.4, 7.4, 6.0])

    add_title(doc, "5. Modules marchands et cas d'usage")
    add_body(
        doc,
        "Le module Marchand ne doit pas etre reduit a un dashboard. Le marchand doit pouvoir operer son activite dans LIPAXE. Les fonctions visibles sont donc differentes selon le metier, tout en partageant les memes regles de paiement, de permissions, de journalisation et de rapprochement.",
    )
    add_table(doc, ["Vertical", "Objets de gestion", "Moment de paiement", "Resultat pour le marchand"], [
        ("Commerce et supermarche", "Articles, categories, stock, caisses, sessions, clients et commandes.", "A la caisse ou par QR produit.", "Vente tracee, stock mis a jour, cloture de caisse et rapport journalier."),
        ("Ecole et universite", "Apprenants, programmes, frais, echeances et factures.", "Inscription, mensualite, examen ou service annexe.", "Suivi des impayes, preuve de paiement et reconciliation par eleve."),
        ("Sante", "Patients, services, visites, factures et departements.", "Consultation, analyse, medicament ou hospitalisation.", "Parcours patient lie a la facture et meilleure tracabilite des encaissements."),
        ("Transport", "Lignes, vehicules, departs et billets.", "Achat de billet, embarquement ou abonnement.", "Controle du billet, vente par trajet et vision par vehicule."),
        ("Hotellerie", "Chambres, reservations, prestations et facture.", "Reservation, sejour, restauration ou service.", "Suivi de disponibilite, facture et encaissement par client."),
        ("Evenementiel", "Evenements, tarifs, billets et controle d'entree.", "Achat de billet en ligne ou au point de vente.", "Capacite controlee, QR de billet et check-in fiable."),
        ("Services", "Rendez-vous, abonnements, clients et factures.", "Reservation, prestation ou renouvellement.", "Reduction des annulations et encaissement recurrent."),
    ], widths=[2.5, 5.2, 4.2, 4.9])

    add_title(doc, "6. Parcours de paiement cible")
    add_body(
        doc,
        "Le parcours standard commence par une intention de paiement associee a une commande, une facture ou un service. Le client confirme l'operation avec son wallet LIPAXE et son mecanisme d'authentification. Le systeme verifie le token, le nonce, l'etat de l'intention, les limites et la disponibilite des fonds. Lorsque le paiement reussit, l'ecriture de wallet est enregistree de maniere idempotente, la transaction marchand est creee, l'objet commercial est mis a jour et une notification est envoyee.",
        "Le reglement marchand est une etape distincte. Il ne doit pas creer une seconde fois les fonds deja comptabilises : il rapproche les encaissements eligibles, applique les regles de disponibilite et fournit une trace de reglement. Les remboursements, litiges, depenses et paies doivent utiliser des workflows d'approbation et des references uniques.",
    )
    add_numbered(doc, [
        "Le marchand cree une commande, facture ou intention de paiement dans le contexte de son business.",
        "Le client ouvre ou scanne le QR, ou utilise un parcours NFC uniquement sur un appareil mobile compatible.",
        "Le serveur verifie l'identite, la signature, le nonce, l'expiration et les regles de risque.",
        "Le wallet client est debite et le ledger cree un recu immutable de l'operation.",
        "La transaction est rattachee au marchand, a l'unite, au terminal et a l'objet commercial.",
        "Le client et le marchand recoivent une confirmation ; un webhook est expedie si le marchand a active cette integration.",
        "Le reglement et les exports permettent ensuite a l'entreprise de rapprocher ses fonds.",
    ])

    add_page_break(doc)
    add_title(doc, "7. Marche cible et lancement")
    add_body(
        doc,
        "Le marche cible est compose d'activites dont le paiement est frequent, visible et sensible a la confiance. Le choix des premiers partenaires doit eviter une dispersion par secteur. LIPAXE doit construire des grappes locales : une zone commerciale, un campus, un reseau de cliniques, une gare ou ligne de transport, un hotel et des organisateurs d'evenements dans une meme ville peuvent creer plus d'usage qu'une longue liste de marchands isoles.",
        "La priorisation geographique Burundi, Rwanda et RDC doit etre confirmee par une etude de marche distincte. Elle doit verifier les usages de paiement, les moyens existants, les couts de distribution, les obligations reglementaires, les partenaires possibles et les corridors de paiement. Le plan present retient ces pays comme territoire cible, sans presenter les hypotheses de demande comme des faits acquis.",
    )
    add_table(doc, ["Segment de lancement", "Critere de selection", "Offre pilote", "Preuve attendue"], [
        ("Commerces de proximite", "Encaissements journaliers, besoin de caisse et de stock, proprietaire disponible.", "QR, caisse, catalogue, stock et releve.", "Transactions recurrentes et clotures de caisse fiables."),
        ("Ecoles et centres de formation", "Frais repetitifs et besoin de preuve parent-eleve.", "Echeances, facture, paiement et recu.", "Taux de rapprochement et baisse des paiements non identifies."),
        ("Cliniques et pharmacies", "Parcours patient ou produit avec besoin de trace.", "Facture, prestation, paiement et rapports.", "Temps de reconciliation et satisfaction du personnel."),
        ("Evenements et transport", "Volume concentre, besoin de controle et de billet.", "Billet QR, check-in ou billet de trajet.", "Vitesse d'encaissement et reduction de fraude ou duplications."),
    ], widths=[3.2, 5.0, 4.8, 4.0])

    add_title(doc, "8. Analyse concurrentielle")
    add_body(
        doc,
        "La concurrence ne vient pas seulement des autres applications. Elle comprend le cash, les operateurs mobile money, les banques, les cartes, les outils de caisse, les logiciels de gestion, les cahiers manuels et les processus informels. Un marchand peut accepter plusieurs moyens de paiement ; LIPAXE doit donc etre choisi non parce qu'il interdit les alternatives, mais parce qu'il rend l'operation plus simple et plus controlable.",
    )
    add_table(doc, ["Alternative", "Force habituelle", "Limite pour le marchand", "Positionnement LIPAXE"], [
        ("Cash", "Universel et immediat.", "Risque de perte, faible tracabilite, rapprochement manuel.", "Encaissement trace et recu sans abandonner les besoins de caisse."),
        ("Mobile money seul", "Usage connu et reseau existant.", "Souvent separe du catalogue, de la facture et de la gestion operationnelle.", "Paiement integre au business, sous reserve des integrations et pays disponibles."),
        ("Banque ou carte", "Confiance institutionnelle.", "Acces, cout ou delai variables selon le segment.", "Experience unifiee lorsque le canal est disponible et conforme."),
        ("ERP ou caisse isolee", "Fonctions de gestion specialisees.", "Paiement et wallet non natifs, cout ou complexite.", "Solution modulaire liee directement a l'encaissement."),
    ], widths=[3.0, 4.2, 5.5, 4.3])

    add_title(doc, "9. Strategie commerciale et distribution")
    add_body(
        doc,
        "La distribution combine vente directe B2B, partenariats sectoriels et acquisition client autour des premiers points d'acceptation. Chaque marchand pilote recoit un onboarding structure : KYB, configuration du business, choix de l'unite, catalogue initial, terminal ou QR, formation de l'equipe, simulation de paiement et periode d'hypercare.",
        "La proposition commerciale doit rester concrete. Au lieu de presenter LIPAXE comme une liste de technologies, le discours doit partir d'un resultat : fermer sa caisse sans ecart inexpliqué, identifier les frais scolaires payes, controler une entree d'evenement, encaisser un transport ou suivre les ventes d'une boutique.",
    )
    add_table(doc, ["Canal", "Cible", "Methode", "Indicateur"], [
        ("Equipe terrain", "PME et commerces prioritaires.", "Demonstration, configuration sur site et accompagnement de la premiere semaine.", "Marchands actifs a 30 jours."),
        ("Partenaires sectoriels", "Ecoles, reseaux de sante, transporteurs, associations.", "Accord de distribution et offre adaptee au secteur.", "Nombre de sites actifs par partenariat."),
        ("Parrainage marchand", "Commerces proches des pilotes.", "Incentive limite et conditionne a l'activite reelle.", "Nouveaux marchands avec transactions recurrentes."),
        ("Communication client", "Clients des marchands actifs.", "QR visible, recu, tutoriel court et support.", "Paiements clients recurrents par point de vente."),
    ], widths=[3.2, 4.4, 5.3, 4.1])

    add_page_break(doc)
    add_title(doc, "10. Modele economique")
    add_body(
        doc,
        "Le modele economique repose sur des revenus directement lies a la valeur creee. Les taux, frais fixes et commissions ne doivent pas etre inscrits comme definitifs avant validation des couts fournisseurs, des obligations fiscales, des marges de liquidite, du cout de support et de la sensibilite des marchands. La transparence tarifaire est une condition de confiance.",
    )
    add_table(doc, ["Source de revenu", "Declencheur", "Principe de calcul", "Point de controle"], [
        ("Frais d'acceptation", "Transaction marchand reussie.", "Pourcentage et/ou frais fixe annonces avant paiement.", "Marge nette apres cout fournisseur, litige et support."),
        ("Abonnement logiciel", "Fonctions de gestion avancees ou multi-sites.", "Forfait par business, unite ou pack sectoriel.", "Retention mensuelle et usage effectif des modules."),
        ("Terminaux et services", "Terminal, configuration, support ou services optionnels.", "Vente, location ou frais de service selon contrat.", "Cout de possession, remplacement et fraude."),
        ("Services de reglement", "Rapprochement, export, integration ou delai de reglement specifique.", "Frais coherents avec le cout et le risque.", "Conformite, reserves et disponibilite de tresorerie."),
    ], widths=[3.4, 4.1, 5.5, 4.0])
    add_body(
        doc,
        "Les achats ou emissions de cartes, les conversions de devises et les services tiers doivent etre comptabilises dans des lignes distinctes. Le financement d'un solde operationnel chez un fournisseur de cartes, par exemple, est une reserve de fonctionnement et non un revenu. Il doit etre suivi par devise, fournisseur, seuil de reapprovisionnement et proprietaire de controle.",
    )

    add_title(doc, "11. Hypotheses financieres a valider")
    add_body(
        doc,
        "Le modele financier detaille devra comporter trois scenarii - prudent, central et accelere - et separer les volumes de paiement, les revenus bruts, les couts de fournisseurs, les frais de distribution, les charges de personnel, les pertes attendues, les reserves de liquidite et les investissements technologiques. Les hypotheses suivantes sont les variables critiques a renseigner avant tout engagement de volume.",
    )
    add_table(doc, ["Hypothese", "Unite", "Statut", "Source de validation"], [
        ("Marchands pilotes actifs", "Nombre par secteur et par ville", "A confirmer", "Contrats pilotes et onboarding effectif."),
        ("Transactions par marchand actif", "Transactions par jour et par mois", "A confirmer", "Donnees reelles des pilotes."),
        ("Panier moyen", "Par secteur et devise", "A confirmer", "Historique marchand et enquete terrain."),
        ("Taux de reussite paiement", "Pourcentage", "A mesurer", "Logs de paiement et tableaux de bord fournisseur."),
        ("Taux de remboursement et litige", "Pourcentage du volume", "A mesurer", "Workflow de support et audit."),
        ("Cout fournisseur et reglement", "Par transaction ou pourcentage", "A contractualiser", "Contrats fournisseurs et grilles tarifaires."),
        ("Reserve de liquidite", "Par devise et canal", "A definir", "Politique treasury et stress tests."),
    ], widths=[4.8, 3.7, 3.0, 5.5])

    add_title(doc, "12. Operations et support")
    add_body(
        doc,
        "LIPAXE doit operer comme une infrastructure de confiance. Chaque business est soumis a un KYB proportionne a son profil. Chaque membre d'equipe marchand recoit un role et des permissions. Les actions sensibles, notamment les remboursements, depenses, paies, changements de configuration, reglements et invitations, doivent produire une trace d'audit.",
        "Le support doit distinguer les incidents utilisateur, marchand, paiement, fournisseur et securite. Les agents ne doivent jamais etre autorises a modifier directement un solde sans workflow comptable. Toute correction doit laisser une reference, une raison, un approbateur et une ecriture inverse ou compensatrice quand elle touche des fonds.",
    )
    add_table(doc, ["Processus", "Responsable principal", "Controle minimum"], [
        ("Onboarding marchand", "Equipe commerciale et KYB", "Documents, statut KYB, business et roles verifies."),
        ("Activation paiement", "Operations paiement", "Test de QR/terminal, wallet de reglement et limites valides."),
        ("Support transaction", "Support et finance operations", "Reference, statut fournisseur, ledger et preuve client consultables."),
        ("Remboursement ou litige", "Responsable autorise", "Motif, validation, plafond, trace de traitement et notification."),
        ("Reglement marchand", "Finance operations", "Transactions eligibles rapprochees et recu de ledger confirme."),
        ("Incident securite", "Equipe risque et securite", "Gel motive, journal d'audit, investigation et escalade."),
    ], widths=[4.0, 4.5, 8.5])

    add_page_break(doc)
    add_title(doc, "13. Architecture, securite et conformite")
    add_body(
        doc,
        "L'architecture marchand est decoupee en domaines : identite et KYB, catalogue, commerce, paiements, reglements, ledger, finance operations, conformite et verticaux. Cette separation reduit le risque qu'une evolution dans l'hotellerie ou l'evenementiel modifie le coeur de paiement. Les dependances sont a sens unique et les ecritures de wallet disposent de references idempotentes.",
        "Les paiements QR et NFC utilisent des tokens signes et a duree courte. Les tentatives incluent un nonce pour limiter les attaques par rejeu. Les actions financieres exigent une authentification forte appropriee au canal, des permissions serveur et des validations d'etat. Les integrations fournisseurs sont journalisees sans exposer les secrets dans les interfaces.",
    )
    add_table(doc, ["Risque", "Mesure de reduction", "Preuve a conserver"], [
        ("Double debit ou double credit", "Reference idempotente, verrouillage, ledger immutable et reprise controlee.", "Reference de paiement, ecriture ledger et statut final."),
        ("Paiement QR falsifie ou rejoue", "Signature, nonce, expiration courte et verification serveur.", "Journal de verification et identifiant de tentative."),
        ("Acces abusif d'un employe", "Roles, permissions, validation cote serveur et audit.", "Compte, role, horodatage et action effectuee."),
        ("Perte de liquidite", "Comptes par devise, seuils de reserve, rapprochement et alertes.", "Rapport de reserve et ecart explique."),
        ("Probleme fournisseur", "Mode sandbox/production explicite, traces de callback et procedures de reprise.", "Payload masque, statut callback et incident."),
    ], widths=[3.3, 7.0, 6.7])
    add_body(
        doc,
        "La conformite legale et reglementaire doit etre validee dans chaque pays avant lancement commercial. Cela comprend au minimum la qualification des services, les exigences d'identification, la protection des donnees, la fiscalite, les contrats fournisseurs, la conservation des preuves et les obligations de declaration. Aucune fonctionnalite ou campagne ne doit etre presentee comme approuvee dans un pays avant confirmation juridique locale.",
    )

    add_title(doc, "14. Equipe, gouvernance et partenaires")
    add_body(
        doc,
        "La structure cible se compose d'une direction produit et strategie, d'une equipe technologique et securite, d'une equipe paiements et finance operations, d'une equipe KYB et conformite, d'une equipe commerciale marchands et d'un support client. Les responsabilites doivent etre separees : une personne ne doit pas pouvoir a elle seule initier, approuver et payer une sortie de fonds.",
    )
    add_table(doc, ["Fonction", "Responsabilite", "Separation de controle"], [
        ("Direction", "Strategie, budget, partenariats et priorites.", "Ne valide pas seule les mouvements financiers sensibles."),
        ("Produit et technologie", "Plateforme, qualite, securite applicative et roadmap.", "Pas d'acces libre aux fonds ou secrets de production."),
        ("Finance operations", "Rapprochement, reserves, reglements, depenses et paie.", "Double validation pour actions definies par politique."),
        ("Risque et conformite", "KYB, alertes, investigations et preuves.", "Independance de decision sur les cas a risque."),
        ("Commercial marchand", "Acquisition, formation et adoption.", "Aucun pouvoir de modification de solde ou de KYB approuve."),
        ("Support", "Resolution guidee et communication.", "Acces limite, trace de chaque intervention et escalade."),
    ], widths=[3.4, 7.3, 6.3])

    add_title(doc, "15. Feuille de route de lancement")
    add_body(
        doc,
        "La feuille de route privilegie la preuve terrain. Chaque phase comporte un seuil de sortie. Une phase n'est pas consideree comme terminee parce qu'une interface est visible ; elle est terminee lorsque les transactions, les reversals, les reglements, le support et les controles sont verifies dans les conditions prevues.",
    )
    add_table(doc, ["Phase", "Periode indicative", "Livrables", "Seuil de sortie"], [
        ("Preparation", "Jusqu'au 3 septembre 2026", "KYB, contrats pilotes, mapping des flux, formation, environnements et support.", "Aucun blocage critique de securite ou de rapprochement."),
        ("Lancement pilote", "4-5 septembre 2026", "Marchands pilotes, QR/terminal, parcours client et hypercare.", "Paiements verifies de bout en bout avec recu et trace."),
        ("Stabilisation", "Semaines 1 a 4", "Correction incidents, rapports, reglements et optimisation onboarding.", "Taux de reussite, support et reconciliation dans les seuils definis."),
        ("Densification", "Mois 2 a 4", "Ajout de marchands par cluster et partenariats sectoriels.", "Usage recurrent et retention des pilotes."),
        ("Extension", "Apres validation", "Nouveaux secteurs, villes, pays ou canaux.", "Validation reglementaire, liquidite et capacite de support."),
    ], widths=[3.0, 3.6, 6.0, 4.4])

    add_page_break(doc)
    add_title(doc, "16. Indicateurs de pilotage")
    add_body(
        doc,
        "Les indicateurs sont organises autour de l'usage, de la fiabilite et du risque. Ils doivent etre analyses par pays, ville, secteur, business, unite, devise et canal lorsque les donnees le permettent. L'objectif n'est pas d'accumuler des chiffres de vanite, mais de prendre les bonnes decisions de produit, liquidite et distribution.",
    )
    add_table(doc, ["Categorie", "Indicateurs prioritaires"], [
        ("Adoption", "Marchands KYB approuves, marchands actifs a 7/30/90 jours, utilisateurs payeurs actifs, taux de recurrence."),
        ("Paiement", "Volume, nombre de transactions, panier moyen, taux de reussite, latence, annulations et expirations."),
        ("Commerce", "Commandes, factures payees, billets controles, sessions de caisse cloturees, stock et impayes selon vertical."),
        ("Finance", "Frais bruts, cout fournisseur, marge nette, reglements, reserves par devise, ecarts de rapprochement."),
        ("Risque", "Alertes, gel, remboursements, litiges, fraude suspectee, echecs de callbacks et tickets support."),
        ("Qualite", "Temps de premiere reponse, delai de resolution, disponibilite, incidents critiques et satisfaction marchand."),
    ], widths=[3.2, 13.8])

    add_title(doc, "17. Principaux risques et reponses")
    add_table(doc, ["Risque", "Impact possible", "Reponse prioritaire"], [
        ("Adoption lente faute de lieux d'usage", "Wallets inactifs et cout d'acquisition eleve.", "Construire des clusters de marchands et mesurer l'usage recurrent avant expansion."),
        ("Dependance fournisseur", "Indisponibilite, cout ou limitation de canal.", "Contrats, monitoring, sandbox distinct, procedures de secours et multi-fournisseur si viable."),
        ("Risque de liquidite", "Retards ou impossibilite de reglement.", "Politique de reserve, seuils, rapprochement quotidien et limites adaptees."),
        ("Fraude ou erreur operationnelle", "Pertes, atteinte a la confiance et risque legal.", "Auth forte, roles, ledger, audit, limites et procedures d'incident."),
        ("Complexite multi-pays", "Retard de lancement ou non-conformite.", "Lancement progressif, avis juridique local et parametrage par pays."),
        ("Produit trop large trop tot", "Equipe dispersee et qualite insuffisante.", "Prioriser les flux critiques et quelques verticaux pilotes."),
    ], widths=[4.0, 5.5, 7.5])

    add_title(doc, "18. Decisions de direction a prendre")
    add_numbered(doc, [
        "Valider les villes et secteurs pilotes ainsi que le nombre maximal de marchands du premier lot.",
        "Valider les canaux de paiement effectivement disponibles par pays et ne pas exposer les canaux non integres comme actifs.",
        "Approuver la politique de KYB, de roles, de remboursements, de reglements et de reserves de liquidite.",
        "Fixer les seuils de sortie du pilote : fiabilite transactionnelle, delai de support, ecart de rapprochement et retention marchand.",
        "Finaliser les contrats et responsabilites avec les fournisseurs de paiement, cartes, notifications et hebergement.",
        "Completer l'etude de marche et le modele financier avec les donnees terrain avant tout objectif de volume ou de rentabilite public.",
    ])

    add_page_break(doc)
    add_title(doc, "Annexe A. Matrice de validation terrain")
    add_body(
        doc,
        "Cette annexe doit etre utilisee avant et pendant le pilote. Une hypothese n'est consideree comme confirmee que lorsqu'une source, une date, un responsable et une decision associee sont renseignes.",
    )
    add_table(doc, ["Hypothese", "Question terrain", "Preuve attendue", "Responsable", "Statut"], [
        ("Besoin marchand", "Quelle tache coute du temps ou cree des erreurs aujourd'hui ?", "Entretien documente et exemple d'operation.", "Commercial marchand", "A renseigner"),
        ("Acceptation client", "Les clients paieront-ils avec leur wallet dans ce contexte ?", "Tests de paiement et taux de retour.", "Produit", "A renseigner"),
        ("Prix acceptable", "Quel frais ou abonnement est percu comme juste ?", "Entretiens et offres pilotes signees.", "Direction commerciale", "A renseigner"),
        ("Canal disponible", "Quel canal est reellement operationnel dans la zone ?", "Test technique et confirmation fournisseur.", "Payments operations", "A renseigner"),
        ("Conformite", "Quelle autorisation ou obligation s'applique ?", "Avis juridique ou autorite competente.", "Conformite", "A renseigner"),
        ("Liquidite", "Quel fonds doit etre disponible par devise ?", "Stress test et politique de reserve.", "Finance operations", "A renseigner"),
    ], widths=[3.0, 4.8, 4.6, 3.2, 2.1])

    add_title(doc, "Annexe B. Questions d'onboarding marchand")
    add_bullets(doc, [
        "Quel est le type d'activite, le nombre de points de vente et le volume approximatif de ventes ?",
        "Quels moyens de paiement sont aujourd'hui acceptes et quelles sont les difficultes rencontrees ?",
        "Le marchand doit-il gerer des articles, un stock, des billets, des reservations, des eleves, des patients ou des rendez-vous ?",
        "Qui peut creer une facture, encaisser, cloturer une caisse, consulter les rapports et approuver une depense ?",
        "Quelle devise est utilisee pour la vente et quelle destination de reglement est souhaitee ?",
        "Quels justificatifs KYB et quelles informations de contact sont disponibles ?",
        "Quelle integration, quel export ou quel webhook est necessaire avec les outils existants ?",
    ])

    add_title(doc, "Annexe C. Notes de mise a jour")
    add_body(
        doc,
        "La vision de ce plan a ete actualisee pour placer les modules marchands au coeur de la strategie d'adoption. Le principe directeur est le suivant : LIPAXE ne cherche pas seulement a rendre possible un paiement ; LIPAXE rend ce paiement utile dans les activites ou les personnes vivent, vendent, apprennent, se soignent, voyagent et organisent des services.",
        "Les chiffres de marche, tarifs definitifs, projections de revenu, capital requis et obligations juridiques doivent etre completes avec les documents d'etude et les validations appropriees. Cette discipline protege le projet contre les promesses non fondees tout en donnant aux equipes une direction commerciale et produit claire.",
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
