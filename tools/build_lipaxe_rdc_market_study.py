from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


OUTPUT = Path(r"C:\Users\Rodrigue\Documents\lipax docs\Étude de marché LIPAXE RDC 2026.docx")
TEAL = "005F53"
DEEP = "102A26"
MINT = "E7F3EF"
PALE = "F5F8F7"
GRAY = "5B6763"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=110, bottom=100, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    tr_pr.append(repeat)


def set_font(run, size=10.5, bold=False, color=DEEP, name="Aptos"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:ascii"), name)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def write_paragraph(paragraph, text, size=10.5, bold=False, color=DEEP, align=None, before=0, after=7):
    paragraph.clear()
    run = paragraph.add_run(text)
    set_font(run, size=size, bold=bold, color=color)
    paragraph.paragraph_format.space_before = Pt(before)
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = 1.15
    if align is not None:
        paragraph.alignment = align
    return paragraph


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    write_paragraph(p, text, size={1: 16, 2: 12.5, 3: 11}[level], bold=True, color=TEAL, before=14 if level == 1 else 8, after=6)
    return p


def add_body(doc, text, emphasis=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.15
    if emphasis and emphasis in text:
        before, after = text.split(emphasis, 1)
        for value, bold in ((before, False), (emphasis, True), (after, False)):
            run = p.add_run(value)
            set_font(run, bold=bold)
    else:
        run = p.add_run(text)
        set_font(run)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    write_paragraph(p, text, size=10.2, after=3)
    return p


def add_note(doc, label, text):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    cell = table.cell(0, 0)
    set_cell_shading(cell, MINT)
    set_cell_margins(cell, 140, 160, 140, 160)
    p = cell.paragraphs[0]
    run = p.add_run(f"{label} ")
    set_font(run, size=9.5, bold=True, color=TEAL)
    run = p.add_run(text)
    set_font(run, size=9.5, color=DEEP)
    p.paragraph_format.space_after = Pt(0)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_table(doc, headers, rows, widths=None, font_size=8.7):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = False
    header = table.rows[0]
    set_repeat_table_header(header)
    for idx, title in enumerate(headers):
        cell = header.cells[idx]
        set_cell_shading(cell, TEAL)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        write_paragraph(cell.paragraphs[0], title, size=8.4, bold=True, color="FFFFFF", after=0)
        if widths:
            cell.width = Cm(widths[idx])
    for row_idx, values in enumerate(rows):
        cells = table.add_row().cells
        for idx, value in enumerate(values):
            cell = cells[idx]
            set_cell_shading(cell, "FFFFFF" if row_idx % 2 == 0 else PALE)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            write_paragraph(cell.paragraphs[0], str(value), size=font_size, after=0)
            if widths:
                cell.width = Cm(widths[idx])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_page_break(doc):
    doc.add_page_break()


def add_source(doc, code, title, publisher, date, url, use):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    run = p.add_run(f"[{code}] {publisher}. ")
    set_font(run, size=8.8, bold=True)
    run = p.add_run(f"{title}. {date}. ")
    set_font(run, size=8.8)
    run = p.add_run(url)
    set_font(run, size=8.8, color=TEAL)
    run = p.add_run(f" — Utilisation : {use}")
    set_font(run, size=8.8, color=GRAY)


def set_document_defaults(doc):
    sec = doc.sections[0]
    sec.top_margin = Cm(1.8)
    sec.bottom_margin = Cm(1.7)
    sec.left_margin = Cm(2.0)
    sec.right_margin = Cm(2.0)
    styles = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"]._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    styles["Normal"]._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    styles["Normal"].font.size = Pt(10.5)
    for name in ("Heading 1", "Heading 2", "Heading 3"):
        style = styles[name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    footer = sec.footer.paragraphs[0]
    write_paragraph(footer, "LIPAXE | Étude de marché RDC | Septembre 2026 | Document de travail confidentiel", size=8, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)


def cover(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(92)
    write_paragraph(p, "LIPAXE", size=31, bold=True, color=TEAL, align=WD_ALIGN_PARAGRAPH.CENTER, after=9)
    write_paragraph(doc.add_paragraph(), "Étude de marché République démocratique du Congo", size=20, bold=True, color=DEEP, align=WD_ALIGN_PARAGRAPH.CENTER, after=10)
    write_paragraph(doc.add_paragraph(), "Paiements numériques et système marchand\nStratégie d'entrée à Kinshasa", size=13, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, after=26)
    table = doc.add_table(rows=4, cols=2)
    table.autofit = False
    rows = [
        ("Périmètre", "République démocratique du Congo, avec pilote Kinshasa"),
        ("Horizon", "Lancement pilote prévu les 4 et 5 septembre 2026"),
        ("Base factuelle", "Questionnaire DUN & BRADSTREET v4, sources publiques et hypothèses testables"),
        ("Statut", "Étude de cadrage stratégique ; à compléter par l'enquête terrain et les validations réglementaires"),
    ]
    for ri, (left, right) in enumerate(rows):
        for ci, value in enumerate((left, right)):
            cell = table.cell(ri, ci)
            set_cell_shading(cell, MINT if ci == 0 else "FFFFFF")
            set_cell_margins(cell, 160, 160, 160, 160)
            write_paragraph(cell.paragraphs[0], value, size=9.5, bold=(ci == 0), color=TEAL if ci == 0 else DEEP, after=0)
            cell.width = Cm(4.2 if ci == 0 else 11.2)
    write_paragraph(doc.add_paragraph(), "Préparé pour la direction de LIPAXE", size=9.5, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, before=32, after=0)
    add_page_break(doc)


def build():
    doc = Document()
    set_document_defaults(doc)
    doc.core_properties.title = "Étude de marché LIPAXE RDC 2026"
    doc.core_properties.subject = "Marché des paiements numériques et système marchand en RDC"
    doc.core_properties.author = "LIPAXE"
    cover(doc)

    add_heading(doc, "Conclusion de direction", 1)
    add_body(doc, "LIPAXE ne doit pas entrer sur le marché congolais comme un portefeuille numérique supplémentaire. Le marché possède déjà des émetteurs de monnaie électronique, des agrégateurs, des banques, un réseau mobile money très vaste et des usages fortement ancrés. L'avantage défendable de LIPAXE est de relier le paiement à l'activité réelle du marchand : vente, facture, caisse, catalogue, stock, rendez-vous, billet, réservation, paie et règlement.")
    add_body(doc, "La première décision stratégique est donc de limiter le lancement à Kinshasa et de sélectionner des clusters où un même client peut payer dans plusieurs lieux fréquents. Le produit doit fonctionner dans des conditions de connectivité, de pouvoir d'achat et de confiance inégales : interface légère, QR imprimable, assistance humaine, preuve de paiement immédiate, compte marchand simple et parcours de récupération en cas d'échec.")
    add_note(doc, "Décision recommandée.", "Lancer en deux voies : une voie B2B concentrée sur les marchands pilotes et une voie client déclenchée par les points d'acceptation. Ne pas financer une acquisition massive d'utilisateurs avant d'avoir validé la fréquence d'usage par marchand.")
    add_heading(doc, "Les cinq choix qui conditionnent le lancement", 2)
    add_table(doc, ["Choix", "Décision", "Pourquoi"], [
        ("Géographie", "Kinshasa d'abord", "La ville concentre l'activité économique, les institutions, les partenaires et une forte densité d'agents mobile money."),
        ("Produit initial", "Encaissement marchand, facture, QR, reçu, caisse et règlement", "Ce sont les fonctions qui créent un usage quotidien et mesurable."),
        ("Segment d'entrée", "Commerce organisé léger, éducation privée, santé de proximité et événementiel fermé", "Paiements fréquents, besoin de preuve, décideur identifiable et cycles de vente accessibles."),
        ("Canaux", "Terrain, partenariats sectoriels, TikTok/Facebook ciblés, référencement et CRM opt-in", "Le numérique seul exclurait une grande partie du marché ; le terrain seul coûte trop cher."),
        ("Conformité", "Opérer uniquement sous une qualification et des partenariats validés", "LIPAXE ne doit pas présenter comme actif un service de paiement qui n'est pas légalement et techniquement prêt."),
    ], widths=[3.0, 5.0, 7.4], font_size=8.5)
    add_page_break(doc)

    add_heading(doc, "1. Objet, périmètre et méthode", 1)
    add_body(doc, "Cette étude évalue la capacité de LIPAXE à lancer un système de paiements et d'exploitation marchande en République démocratique du Congo. Elle couvre la demande utilisateur, les besoins des marchands, l'environnement numérique, le cadre concurrentiel et réglementaire, la stratégie marketing, l'ordre de lancement et les risques. Elle ne constitue ni un avis juridique, ni une autorisation de fournir un service financier.")
    add_heading(doc, "1.1 Sources et limites", 2)
    add_body(doc, "L'analyse utilise le questionnaire DUN & BRADSTREET v4 de LIPAXE comme source d'identité de l'entreprise, les publications de la Banque Centrale du Congo pour les infrastructures et la réglementation, les données publiques de connectivité et les sources macroéconomiques. Les estimations de taille de marché et de revenus sont des hypothèses de travail à confronter à une enquête terrain avant tout engagement de trésorerie.")
    add_table(doc, ["Type d'information", "Source", "Niveau de confiance", "Usage dans la stratégie"], [
        ("Identité LIPAXE", "Questionnaire DUN & BRADSTREET v4", "Élevé, sous réserve des pièces légales", "Gouvernance, capital, effectif, ventes déclarées"),
        ("Paiements et agents", "Rapport annuel BCC 2024", "Élevé", "Potentiel mobile money, densité des agents, interopérabilité"),
        ("Connectivité et médias", "DataReportal 2025 / données plateformes", "Moyen à élevé", "Choix marketing et conception de parcours légers"),
        ("Macroéconomie et pouvoir d'achat", "Banque mondiale 2025-2026", "Élevé", "Politique de prix, segmentation, résilience"),
        ("Concurrence et licences", "Registres et réglementation BCC", "Élevé", "Choix de partenaires, périmètre autorisé et risques"),
        ("Besoins locaux précis", "À collecter par LIPAXE", "À construire", "Priorisation des quartiers, prix et conversion commerciale"),
    ], widths=[3.2, 4.0, 2.4, 5.8], font_size=8.3)
    add_heading(doc, "1.2 Questions auxquelles le pilote doit répondre", 2)
    for item in [
        "Quels marchands obtiennent au moins 30 paiements LIPAXE par mois après 60 jours ?",
        "Quel parcours convertit un premier paiement en deuxième paiement en moins de 30 jours ?",
        "Quel coût d'acquisition marchand reste inférieur à la marge nette attendue sur douze mois ?",
        "Quels canaux de paiement et de règlement fonctionnent sans rapprochement manuel ni perte de fonds ?",
        "Quels secteurs acceptent un abonnement logiciel, en plus des frais liés au paiement ?",
    ]:
        add_bullet(doc, item)
    add_page_break(doc)

    add_heading(doc, "2. Réalité économique et numérique de la RDC", 1)
    add_heading(doc, "2.1 Une économie en croissance, mais un pouvoir d'achat contraint", 2)
    add_body(doc, "La croissance économique ne signifie pas automatiquement une capacité de paiement homogène. La Banque mondiale estime la croissance réelle de la RDC à 5,5 % en 2025, mais souligne que la pauvreté demeure très élevée et que le secteur minier crée peu d'emplois directs. Pour LIPAXE, cela implique une grille tarifaire basse, lisible et une proposition de valeur qui réduit un coût concret : temps de caisse, fuite de recettes, erreur de rapprochement, absence de reçu ou relance manuelle. [S3]")
    add_table(doc, ["Signal", "Lecture marché", "Conséquence LIPAXE"], [
        ("Pauvreté et revenus irréguliers", "Le prix et le risque perçu dominent la décision", "Aucun frais caché ; frais affichés avant confirmation ; offres marchandes simples"),
        ("Inflation et volatilité", "Les montants et marges doivent être suivis en CDF et devises de référence", "Moteur de taux, durée de validité courte des devis, réserve de liquidité"),
        ("Économie informelle", "La preuve de paiement et la caisse simple valent autant que le paiement lui-même", "QR, reçu SMS/app, clôture de caisse, export et historique"),
        ("Jeunesse démographique", "Fort potentiel d'adoption mais hétérogénéité du smartphone et des revenus", "Onboarding très court, langage clair, tutoriels vidéo courts et support humain"),
    ], widths=[3.2, 5.2, 7.0], font_size=8.5)
    add_heading(doc, "2.2 Connectivité : un marché mobile, pas un marché web uniquement", 2)
    add_body(doc, "Au début de 2025, la RDC comptait environ 60,3 millions de connexions mobiles et 34,0 millions d'utilisateurs d'internet ; 69,4 % de la population restait hors ligne. Ces données imposent un produit qui ne dépend pas d'une navigation web continue. Le QR imprimable, les écrans rapides, la reprise après réseau instable, les notifications sobres et les agents de support doivent être traités comme des exigences de base. [S2]")
    add_table(doc, ["Indicateur 2025", "Valeur", "Lecture"], [
        ("Connexions mobiles actives", "60,3 millions", "Base de distribution importante, mais une connexion n'équivaut pas à un smartphone ou à un utilisateur unique."),
        ("Utilisateurs internet", "34,0 millions", "Le web et les réseaux sociaux sont utiles pour l'acquisition, mais insuffisants comme unique canal."),
        ("Population hors ligne", "77,1 millions", "Concevoir des parcours peu consommateurs de données et assurer une présence terrain."),
        ("Connexions à haut débit mobile", "75,1 % des connexions", "Potentiel pour une application mobile, sous réserve de forfait et de qualité réseau réelle."),
    ], widths=[4.0, 3.1, 8.3], font_size=8.5)
    add_page_break(doc)

    add_heading(doc, "3. Paiements et concurrence", 1)
    add_heading(doc, "3.1 Le marché ne part pas de zéro", 2)
    add_body(doc, "La BCC indique qu'à fin 2024, les comptes mobile money enregistrés étaient passés de 46 à 52 millions, dont 17 millions actifs. Le réseau comptait 1 012 056 agents enregistrés, dont 51 % actifs ; Kinshasa concentrait à elle seule 266 040 agents. LIPAXE ne doit donc pas chercher à remplacer les usages existants dès le départ. Il doit les connecter à une meilleure expérience de paiement marchand, de preuve et de gestion. [S1]")
    add_table(doc, ["Acteur ou catégorie", "Force existante", "Limite exploitable par LIPAXE", "Réponse stratégique"], [
        ("Émetteurs de monnaie électronique", "Marque, distribution, agents, wallets", "Gestion métier marchand souvent distincte du paiement", "Interopérer ou s'intégrer lorsque c'est autorisé ; vendre l'OS marchand"),
        ("Banques et cartes", "Confiance institutionnelle, comptes, conformité", "Parcours parfois plus lourds pour les petites entreprises", "Réconciliation, facturation et exports pour les marchands"),
        ("Agrégateurs et PSP", "Connecteurs de paiement et APIs", "Proposition souvent centrée sur l'acceptation", "Offre verticale : catalogue, caisse, clients, règlement, audit"),
        ("Caisse ou ERP isolé", "Gestion locale des ventes", "Paiement, reçu et wallet non intégrés", "Commande à paiement à ledger dans un même parcours"),
        ("Cash et cahier", "Simplicité apparente, ubiquité", "Fuite, absence de preuve, clôture manuelle", "QR + reçu + caisse + rapports sans matériel lourd"),
    ], widths=[3.0, 3.5, 4.8, 4.1], font_size=8.0)
    add_heading(doc, "3.2 Implication réglementaire", 2)
    add_body(doc, "Le cadre de la BCC distingue les établissements de monnaie électronique, les systèmes de paiement, les agrégateurs et les prestataires connexes. La BCC publie notamment l'Instruction n°24 relative à l'émission de monnaie électronique, l'Instruction n°42 sur la monétique, l'Instruction n°52 sur les incidents de paiement et l'Instruction n°58 sur l'interopérabilité. LIPAXE doit faire valider son rôle exact avant activation : logiciel marchand, agrégateur, agent, partenaire d'un établissement agréé ou autre configuration. [S4]")
    add_note(doc, "Règle de lancement.", "Aucune publicité ne doit promettre dépôt, retrait, transfert international, émission de monnaie électronique, carte ou conversion tant que le canal, le partenaire, l'autorisation, la liquidité, les limites et le support ne sont pas effectivement opérationnels.")
    add_heading(doc, "3.3 Positionnement de marché", 2)
    add_body(doc, "La position à défendre est : « LIPAXE aide un marchand à encaisser et à gérer son activité dans le même système ». Le paiement est l'entrée, mais l'abonnement, la rétention et la valeur viennent de l'organisation du business. Cette position évite une compétition frontale basée uniquement sur les frais de transfert.")
    add_page_break(doc)

    add_heading(doc, "4. Segmentation et priorités commerciales", 1)
    add_heading(doc, "4.1 Segments clients", 2)
    add_table(doc, ["Segment", "Douleur prioritaire", "Produit initial", "Signal d'adoption", "Priorité"], [
        ("Commerce de proximité organisé", "Caisse, preuve, rupture de stock, perte de temps", "QR, caisse, catalogue, reçu, clôture", "30 paiements/mois et clôture de caisse hebdomadaire", "1"),
        ("Éducation privée", "Frais récurrents, relances, reçus, visibilité parents", "Facture, échéancier, reçu, export", "50 % des paiements ciblés tracés en 90 jours", "1"),
        ("Santé de proximité", "Paiement consultation/pharmacie, confidentialité, reçu", "Facture, QR, caisse par point, rôles", "Réduction des écarts de caisse et délai d'encaissement", "1"),
        ("Événementiel", "Billetterie, contrôle, paiement sur site, remboursement", "Billet QR, caisse événement, rapports", "Taux de scan et réconciliation après événement", "2"),
        ("Transport et mobilité", "Encaissement fréquent, réseau instable, fraude", "QR dynamique, caisse agent, historique", "Paiements répétés avec taux d'échec acceptable", "2"),
        ("Hôtellerie et restauration", "Réservation, commande, caisse, pourboire", "Commande, facture, QR et règlement", "Panier moyen, fréquence et temps de clôture", "3"),
        ("Administration, paie et fournisseurs", "Validation, traces, rapprochements", "Workflows, rôles, factures et exports", "Cycle d'approbation réduit et pièces complètes", "3"),
    ], widths=[3.0, 3.5, 3.8, 4.0, 1.2], font_size=7.7)
    add_heading(doc, "4.2 Trois niveaux de maturité à servir", 2)
    add_table(doc, ["Niveau", "Profil", "Ce qu'il faut proposer", "Ce qu'il ne faut pas imposer"], [
        ("Essentiel", "Micro-commerce, faible temps disponible, cash dominant", "QR imprimé, encaissement, reçu, montant simple, support WhatsApp/SMS", "ERP complexe, contrat long, jargon financier"),
        ("Croissance", "PME avec employés, produits et plusieurs opérations", "Catalogue, caisse, factures, rôles, rapports et export", "Configuration longue ou matériel propriétaire obligatoire"),
        ("Institution", "École, clinique, réseau multi-sites, entreprise", "Unités, permissions, approbations, API, audit, règlement", "Offre standard sans SLA, gouvernance ni piste d'audit"),
    ], widths=[2.0, 4.0, 5.3, 4.2], font_size=8.2)
    add_heading(doc, "4.3 Première cible géographique", 2)
    add_body(doc, "Le pilote doit s'appuyer sur des micro-clusters à Kinshasa, non sur une couverture déclarative de la ville. Chaque cluster doit réunir un décideur marchand, une fréquentation identifiable, un parcours de paiement répété et un support accessible. Le premier mois doit privilégier deux à quatre clusters seulement, par exemple un ensemble commerce-éducation-santé dans une zone accessible, puis un vertical événementiel fermé servant de test intensif.")
    add_page_break(doc)

    add_heading(doc, "5. Stratégie de produit et d'expérience", 1)
    add_heading(doc, "5.1 Le produit minimal vendable", 2)
    add_table(doc, ["Composant", "Obligation au lancement", "Mesure de qualité"], [
        ("Compte marchand et KYB", "Création, pièces, statut de revue, rôles", "Délai de décision KYB, dossiers incomplets, réouvertures"),
        ("QR de paiement", "Montant fixe ou dynamique, expiration, signature et anti-rejeu", "Taux de paiement réussi, tentatives doublons, délai de confirmation"),
        ("Caisse", "Ouverture, vente, clôture, écart, justificatif", "Écarts de caisse, temps de clôture, correction documentée"),
        ("Facture et reçu", "Référence unique, client, état, notification", "Part de paiements rattachés à une facture ou commande"),
        ("Ledger et règlement", "Écriture immuable, solde marchand, règles de règlement", "Écart de rapprochement, montant en attente, délai de règlement"),
        ("Support et incident", "Statut, horodatage, canal, escalade, réponse", "Temps de première réponse, résolution, récurrence"),
    ], widths=[3.2, 7.2, 4.8], font_size=8.3)
    add_heading(doc, "5.2 Parcours à faible connectivité", 2)
    for item in [
        "Le QR doit rester utilisable sous forme imprimée et identifier clairement le marchand, le point de vente et l'état de l'intention.",
        "L'application ne doit pas masquer un paiement en attente : elle doit afficher un état lisible, permettre une vérification et empêcher un double débit.",
        "Le reçu doit être accessible dans l'application et partageable par un canal choisi par l'utilisateur, avec le nom humain du moyen de paiement.",
        "Le personnel marchand doit pouvoir vérifier une transaction par référence, QR ou interface caisse sans demander d'information sensible au client.",
        "Les opérations à risque élevé doivent exiger PIN ou biométrie sur mobile ; le navigateur ne doit pas simuler des fonctions NFC ou nearby réservées au mobile.",
    ]:
        add_bullet(doc, item)
    add_heading(doc, "5.3 Proposition de valeur par partie", 2)
    add_table(doc, ["Partie", "Promesse", "Preuve attendue"], [
        ("Client", "Payer rapidement et retrouver une preuve", "Reçu immédiat, statut clair, historique compréhensible"),
        ("Caissier", "Encaisser sans erreur ni discussion sur le paiement", "QR validé, référence, écran de caisse et procédure incident"),
        ("Propriétaire", "Voir les ventes et limiter les fuites", "Clôture, rapports, rôles, exports et rapprochement"),
        ("Finance", "Régler et justifier chaque mouvement", "Ledger, transactions, frais, règlement et audit"),
        ("Partenaire financier", "Intégration fiable et surveillable", "Idempotence, callbacks, traces, limites, alertes et réconciliation"),
    ], widths=[2.5, 5.5, 7.2], font_size=8.4)
    add_page_break(doc)

    add_heading(doc, "6. Go-to-market et réseaux marketing", 1)
    add_heading(doc, "6.1 Architecture d'acquisition", 2)
    add_body(doc, "L'acquisition doit partir du marchand et non d'une campagne de téléchargements. Chaque marchand pilote reçoit une proposition centrée sur son problème immédiat, une configuration rapide, une formation, une période d'hypercare et un tableau de résultats. Le client découvre LIPAXE au point de vente, paie, reçoit une preuve et a une raison de revenir chez un autre partenaire.")
    add_table(doc, ["Canal", "Rôle", "Public", "Indicateur à suivre"], [
        ("Vente terrain B2B", "Signer, qualifier et activer les marchands", "Propriétaires, directions, gérants", "Rendez-vous, taux de signature, marchand actif à J30"),
        ("Partenaires sectoriels", "Accélérer la confiance et l'accès aux clusters", "Écoles, cliniques, associations, organisateurs", "Leads qualifiés, coûts d'acquisition, activation"),
        ("TikTok", "Notoriété et démonstration produit courte", "18-34 ans connectés", "Vues qualifiées, clics, premiers paiements et rétention"),
        ("Facebook", "Communautés locales, retargeting et preuve sociale", "Adultes connectés et gérants", "Messages utiles, demandes B2B, conversions"),
        ("Google et SEO", "Capturer l'intention d'un marchand qui cherche une solution", "PME et institutions", "Leads organiques, demande de démonstration, coût par lead"),
        ("CRM opt-in", "Réactivation, reçu, éducation et support", "Clients ayant consenti", "Ouverture, clic, second paiement, désinscription"),
        ("Ambassadeurs marchands", "Références réelles et démonstration entre pairs", "Réseaux de commerçants", "Parrainages actifs et volume récurrent"),
    ], widths=[2.6, 4.0, 3.1, 5.4], font_size=7.9)
    add_heading(doc, "6.2 Utilisation réaliste des réseaux sociaux", 2)
    add_body(doc, "Les réseaux sociaux ne doivent pas être traités comme une couverture nationale abstraite. DataReportal estime la portée publicitaire TikTok à 6,73 millions d'adultes en RDC début 2025, contre environ 758 000 utilisateurs Instagram et 830 000 membres LinkedIn. TikTok peut donc servir à la démonstration et à l'éducation grand public ; Facebook aux communautés et à la réassurance ; LinkedIn aux partenariats B2B institutionnels. Chaque annonce doit renvoyer vers une action mesurable : demander une démonstration, trouver un marchand, payer une facture ou rejoindre une liste d'attente. [S2]")
    add_table(doc, ["Période", "Message", "Format", "Appel à l'action"], [
        ("Pré-lancement", "Un paiement utile commence chez un marchand réel", "Vidéo 15-25 secondes, témoignage marchand", "Inscrire son business au pilote"),
        ("Lancement", "Payer, recevoir son reçu, retrouver son historique", "Démonstration QR en point de vente", "Effectuer un premier paiement"),
        ("Après paiement", "Votre preuve est enregistrée", "Notification et page détail", "Ajouter un autre marchand ou inviter un proche"),
        ("B2B", "Réduire les écarts de caisse et les relances", "Cas client, capture de rapport, webinaire court", "Réserver une démonstration"),
    ], widths=[2.5, 5.0, 4.0, 3.6], font_size=8.0)
    add_page_break(doc)

    add_heading(doc, "7. Modèle économique et seuils de validation", 1)
    add_heading(doc, "7.1 Sources de revenus à activer progressivement", 2)
    add_table(doc, ["Revenu", "Quand l'activer", "Condition de sécurité et de marge"], [
        ("Commission d'acceptation", "Dès qu'un canal de paiement est validé", "Frais fournisseur, reversements et réserve inclus dans le calcul"),
        ("Abonnement marchand", "Après usage récurrent des fonctions de gestion", "Offre simple, valeur visible, possibilité de changement de plan"),
        ("Onboarding et intégration", "Pour entreprises à besoins spécifiques", "Devis, périmètre, recette et support contractualisés"),
        ("Terminal ou matériel", "Uniquement avec inventaire et maintenance définis", "Propriété, dépôt, remplacement, fraude et logistique documentés"),
        ("Services verticaux", "Après preuve de product-market fit par secteur", "Billetterie, réservation, facture ou paie avec règles propres"),
    ], widths=[3.5, 5.0, 6.6], font_size=8.4)
    add_heading(doc, "7.2 Unit economics à mesurer, non à supposer", 2)
    add_body(doc, "Le prix public ne doit pas être fixé comme un pourcentage isolé. Chaque opération doit inclure le coût fournisseur, les frais de réseau, la fraude attendue, le support, la réserve de liquidité, le coût de rapprochement et la marge. LIPAXE doit produire un rapport quotidien par canal : montant traité, revenu brut, frais tiers, coûts de correction, montant à régler et marge nette.")
    add_table(doc, ["KPI", "Définition", "Seuil pilote proposé"], [
        ("Marchand activé", "KYB validé, QR ou caisse configuré, équipe formée", "100 % des marchands signés"),
        ("Marchand actif J30", "Au moins 30 paiements réussis ou activité équivalente", "> 60 % des marchands activés"),
        ("Taux de succès", "Paiements réussis / intentions confirmées", "> 97 % hors indisponibilités fournisseur documentées"),
        ("Écart de rapprochement", "Différence entre transaction, ledger et fournisseur", "0 non expliqué à la clôture J+1"),
        ("Second paiement client", "Clients payant une deuxième fois dans les 30 jours", "> 25 % au pilote, à recalibrer par vertical"),
        ("Temps de résolution incident", "De l'ouverture à la clôture documentée", "P95 inférieur à 24 h pour les incidents non fournisseurs"),
    ], widths=[3.0, 6.8, 5.3], font_size=8.1)
    add_note(doc, "Interprétation financière.", "Le capital autorisé et émis de CDF 83 335 000 déclaré dans le questionnaire v4 n'est pas libéré. Le plan de dépenses doit donc être déclenché par tranches, seulement après preuve de libération ou financement disponible, et non par anticipation.")
    add_page_break(doc)

    add_heading(doc, "8. Plan de lancement Kinshasa", 1)
    add_table(doc, ["Étape", "Période", "Livrable", "Condition de passage"], [
        ("Préparation", "J-60 à J-30", "Cartographie de 100 marchands, 20 entretiens, partenaires et checklist conformité", "Canaux autorisés et support disponibles"),
        ("Sélection pilote", "J-30 à J-14", "10 à 20 marchands signés, KYB en cours, configuration prête", "Décideur, cas d'usage et équipe identifiés"),
        ("Recette terrain", "J-14 à J-1", "Tests de paiement, reçu, caisse, webhooks, rapprochement et incident", "Aucun écart de fonds non expliqué"),
        ("Lancement", "4-5 septembre 2026", "Hypercare, point de contact, tableau de bord d'incident et communication limitée", "Support et procédures de repli actives"),
        ("Apprentissage", "J+1 à J+30", "Rapport quotidien puis hebdomadaire par marchand et canal", "Décision de densification ou correction"),
        ("Densification", "Mois 2 à 4", "Ajout de marchands dans les clusters validés", "Objectifs de rétention, rapprochement et marge atteints"),
    ], widths=[2.8, 2.6, 6.0, 4.0], font_size=8.0)
    add_heading(doc, "8.1 Rituel de pilotage", 2)
    for item in [
        "Tous les jours : volume, taux de succès, incidents, écarts ledger-fournisseur, soldes de règlement et tickets support.",
        "Chaque semaine : marchands actifs, clients récurrents, coûts de support, état KYB, qualité de clôture de caisse et priorités produit.",
        "Chaque mois : marge par canal, taux de désactivation, fraude, litiges, satisfaction, concentration de liquidité et décision d'investissement.",
        "Avant toute extension : revue des risques, validation juridique, preuve de trésorerie et capacité de support local.",
    ]:
        add_bullet(doc, item)
    add_heading(doc, "8.2 Gouvernance de l'exécution", 2)
    add_body(doc, "Le CEO pilote les partenariats, le budget et les décisions de lancement ; le PCA pilote la gouvernance, le produit et les contrôles de décision ; les responsabilités du troisième cofondateur doivent être formalisées. Aucune personne ne doit pouvoir seule créer un bénéficiaire de règlement, modifier un solde, valider une dépense et exécuter un paiement. Les rôles et preuves doivent être contrôlés côté serveur.")
    add_page_break(doc)

    add_heading(doc, "9. Risques, signaux d'alerte et réponses", 1)
    add_table(doc, ["Risque", "Signal d'alerte", "Prévention", "Réponse"], [
        ("Canal fournisseur indisponible", "Échecs répétés, callback absent, solde ou latence anormale", "Sandbox, monitoring, idempotence, SLA et procédure de repli", "Suspendre le canal, informer clairement, rapprocher et reprendre sans doublon"),
        ("Perte de fonds ou écart", "Différence wallet-ledger-fournisseur", "Double écriture, limite de rôle, journal immuable et rapprochement J+1", "Geler l'opération concernée, tracer, corriger par écriture inverse approuvée"),
        ("Fraude QR ou social engineering", "QR modifié, pression sur le client, comptes récents", "Signature, nonce, expiration, nom marchand visible, PIN/biométrie", "Bloquer, enquêter, notifier et documenter"),
        ("Faible adoption", "Premier paiement sans second paiement, QR non affiché", "Choisir un usage fréquent, former le marchand, mesurer J7/J30", "Réviser le segment, le prix, le parcours ou arrêter le cluster"),
        ("Coût de support élevé", "Tickets récurrents sur mêmes étapes", "UX claire, statuts visibles, tutoriels et procédure caisse", "Corriger le produit avant d'augmenter l'acquisition"),
        ("Risque réglementaire", "Périmètre ambigu, partenaire non autorisé, marketing trop large", "Avis juridique, registre des canaux, validation conformité", "Désactiver le service et corriger la communication"),
    ], widths=[2.5, 3.9, 5.0, 4.0], font_size=7.8)
    add_heading(doc, "10. Étude terrain indispensable avant expansion", 1)
    add_body(doc, "Les données en ligne permettent de cadrer une stratégie, mais elles ne remplacent pas les preuves locales. LIPAXE doit exécuter une enquête courte, documentée et géolocalisée à Kinshasa avant tout déploiement large. Le but est de confirmer les habitudes de paiement, les coûts, les réseaux, la confiance, la disponibilité technique et la propension à payer pour un logiciel marchand.")
    add_table(doc, ["Échantillon", "Nombre minimal", "Questions décisives", "Décision produite"], [
        ("Micro et petits commerces", "60", "Ventes/jour, moyens acceptés, pertes, besoins caisse, budget logiciel", "Segment et prix d'entrée"),
        ("Écoles et centres de formation", "15", "Frais, retards, reçus, parents, validation", "Offre facture et échéancier"),
        ("Cliniques, pharmacies et laboratoires", "15", "Flux patient, confidentialité, caisse, rôles", "Parcours santé"),
        ("Événementiel et transport", "20", "Volume de pointe, contrôle, réseau, remboursement", "Cas d'usage fermé et exigences offline"),
        ("Utilisateurs finaux", "150", "Téléphone, wallet, confiance, compréhension QR, frais", "UX, formation et messages marketing"),
        ("Partenaires financiers et techniques", "10", "API, SLA, règlement, limites, support, conformité", "Choix des partenaires et plan de repli"),
    ], widths=[3.6, 2.4, 6.0, 3.4], font_size=8.0)
    add_page_break(doc)

    add_heading(doc, "Annexe A. Guide d'entretien marchand", 1)
    for question in [
        "Décrivez une journée de ventes : nombre de transactions, panier moyen, heures de pointe et rôles des employés.",
        "Quels moyens de paiement acceptez-vous aujourd'hui ? Lequel crée le plus d'erreurs, d'attente ou de litiges ?",
        "Comment prouvez-vous qu'un client a payé ? Comment clôturez-vous votre caisse ?",
        "Avez-vous besoin de factures, de produits, de stock, de rendez-vous, de billets ou de plusieurs points de vente ?",
        "Quel montant mensuel pourriez-vous accepter pour une solution qui réduit une difficulté réelle ?",
        "Quelles conditions vous feraient arrêter le service : frais, réseau, délai de règlement, support, confiance, formation ?",
        "Accepteriez-vous un pilote de 60 jours ? Qui doit décider et signer ?",
    ]:
        add_bullet(doc, question)
    add_heading(doc, "Annexe B. Tableau de qualification d'un marchand pilote", 1)
    add_table(doc, ["Critère", "Score 0", "Score 1", "Score 2"], [
        ("Fréquence de paiement", "Rare", "Hebdomadaire", "Quotidienne"),
        ("Décideur disponible", "Absent", "Intermédiaire", "Décideur engagé"),
        ("Besoin de preuve", "Faible", "Présent", "Critique"),
        ("Équipe à former", "Instable", "Partielle", "Disponible"),
        ("Connectivité", "Instable non testée", "Acceptable", "Testée au point de vente"),
        ("Valeur logicielle", "Paiement seul", "Caisse ou facture", "Paiement + gestion métier"),
        ("Risque opérationnel", "Élevé", "Gérable", "Faible et documenté"),
    ], widths=[4.2, 3.8, 3.8, 3.8], font_size=8.1)
    add_body(doc, "Règle proposée : sélectionner d'abord les marchands obtenant au moins 10/14, sans score nul sur le décideur, la connectivité testée ou le risque opérationnel.")
    add_page_break(doc)

    add_heading(doc, "Annexe C. Sources consultées", 1)
    add_source(doc, "S1", "Rapport annuel 2024", "Banque Centrale du Congo", "2025", "https://www.bcc.cd/sites/default/files/publications/rapport_annuel_2024.pdf", "Comptes mobile money, agents, systèmes de paiement")
    add_source(doc, "S2", "Digital 2025 The Democratic Republic of the Congo", "DataReportal", "2025", "https://datareportal.com/reports/digital-2025-democratic-republic-of-the-congo", "Connectivité, internet et audiences des plateformes")
    add_source(doc, "S3", "Democratic Republic of Congo overview", "Groupe de la Banque mondiale", "consulté en septembre 2026", "https://www.worldbank.org/ext/en/country/drc", "Conjoncture, pauvreté et risques macroéconomiques")
    add_source(doc, "S4", "Réglementation des systèmes de paiement et infrastructures", "Banque Centrale du Congo", "consulté en septembre 2026", "https://www.bcc.cd/intermediaires-financiers/reglementation/par-nature/systemes-de-paiement", "Instructions, interopérabilité et cadre de paiement")
    add_source(doc, "S5", "Cartographie des systèmes et services de paiement", "Banque Centrale du Congo", "consulté en septembre 2026", "https://www.bcc.cd/intermediaires-financiers/systemes-de-paiement/infrastructures", "MOSOLO, catégories de prestataires et interopérabilité")
    add_source(doc, "S6", "Établissements émetteurs de monnaie électronique", "Banque Centrale du Congo", "consulté en septembre 2026", "https://bcc.cd/surveillance-des-intermediaires-financiers/intermediaires-financiers-assujettis/etablissements-de-credit/societes-financieres/ee", "Concurrence réglementée et émetteurs identifiés")
    add_source(doc, "S7", "Registre des prestataires de services connexes agréés", "Banque Centrale du Congo", "15 juillet 2026", "https://www.bcc.cd/intermediaires-financiers/prestataires-services-connexes", "Écosystème des prestataires et partenaires potentiels")
    add_source(doc, "S8", "State of the Industry Report on Mobile Money 2026", "GSMA", "2026", "https://www.gsma.com/sotir/", "Tendance mondiale du paiement marchand mobile")
    add_note(doc, "Mise à jour requise.", "Avant diffusion externe, vérifier chaque URL, chaque statut réglementaire, les tarifs des partenaires et toutes les données terrain. Les données de plateformes publicitaires sont indicatives et peuvent être révisées par leurs éditeurs.")

    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
