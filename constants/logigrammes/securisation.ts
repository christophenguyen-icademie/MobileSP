// LOGI 01 à 04 / 07-2026 — Logigrammes PSE.pdf, pages 4 à 7.
import type { DefinitionLogigramme } from '@/types/logigrammes';
import { action, aller, appeler, fin, question, vers } from './construction';

export const securiser: DefinitionLogigramme = {
  debut: 'observer', etapes: {
    observer: action('Interroger, observer et repérer', 'controle', ['Interroger les témoins et les victimes.', 'Observer et repérer les dangers et les personnes exposées.'], '1er regard'),
    controle: question('Le danger est-il contrôlable ?', [vers('Oui', 'proteger'), vers('Non', 'danger')]),
    proteger: action('Protéger du danger', 'zone'),
    danger: question('Le danger est-il réel, immédiat et vital ?', [vers('Oui', 'degagement'), vers('Non', 'zone')]),
    degagement: question('Un dégagement est-il possible ?', [vers('Oui', 'urgence'), vers('Non', 'zone')]),
    urgence: action('Effectuer un dégagement d’urgence', 'zone', ['Par les chevilles, les vêtements, les poignets ou sous les aisselles.', 'D’un enfant ou nourrisson, par équipier relai ou sortie d’un véhicule, selon la situation.']),
    zone: action('Délimiter la zone et empêcher d’approcher', 'fin'),
    fin: fin(),
  },
};

export const reperer: DefinitionLogigramme = {
  debut: 'securite', etapes: {
    securite: question('Sécuriser l’intervention avant l’engagement', [appeler('Ouvrir « Sécuriser l’intervention »', '01', 'engagement'), vers('Intervention déjà sécurisée', 'engagement')]),
    engagement: action('Engagement : rejoindre la victime la plus proche', 'deces', ['Le repérage sur le chantier doit être très rapide et repose sur des critères simples.']),
    deces: question('Le décès ne fait-il aucun doute ?', [vers('Oui', 'noir'), vers('Non', 'hemorragie')], ['Tête séparée du tronc, victime déchiquetée, démembrée ou raideur cadavérique.']),
    hemorragie: question('Une hémorragie est-elle présente ?', [appeler('Oui – arrêter l’hémorragie', '03', 'conscience'), vers('Non', 'conscience')]),
    conscience: question('La victime a-t-elle perdu connaissance ?', [appeler('Oui – libérer les voies aériennes', '04', 'respiration', 'ventre'), vers('Non', 'detresse')]),
    respiration: question('La victime respire-t-elle après libération des voies aériennes ?', [vers('Oui – position latérale de sécurité', 'pls'), vers('Non', 'noir')]),
    pls: action('Mettre en position latérale de sécurité', 'rouge'),
    detresse: question('Hémorragie ou détresse vitale chez la victime consciente ?', [appeler('Oui – mettre en position d’attente', '08', 'rouge'), vers('Non', 'mobilite')], [
      'Le tableau de repérage classe en rouge une victime avec une hémorragie ou une détresse vitale.',
      'Apprécier respiration et circulation sans excéder 15 secondes par fonction.',
      'Chez l’adulte, en situation de nombreuses victimes : fréquence respiratoire > 30 mouvements/min ou fréquence circulatoire > 120 battements/min.',
    ]),
    mobilite: question('La victime est-elle incapable de se déplacer ?', [vers('Oui', 'jaune'), vers('Non – seule ou aidée', 'vert')]),
    noir: action('NOIR – ne pas déplacer la victime', 'bracelet'),
    rouge: action('ROUGE – laisser la victime sur place', 'bracelet', ['Couvrir si possible.']),
    jaune: action('JAUNE – laisser la victime sur place', 'bracelet'),
    vert: action('VERT – envoyer la victime au PRV', 'bracelet'),
    bracelet: question('Poser un bracelet si possible', [vers('Changer de victime', 'deces'), vers('Repérage terminé', 'consignes')]),
    consignes: action('Prendre les consignes auprès du commandement', 'fin', ['Engager les gestes complémentaires en fonction des consignes du moment.']),
    fin: fin(),
  },
};

export const hemorragie: DefinitionLogigramme = {
  debut: 'protection', etapes: {
    protection: action('Se protéger du sang', 'type'),
    type: question('Identifier le type d’hémorragie', [vers('Externe', 'vetements'), vers('Extériorisée', 'exteriorisee')]),
    vetements: action('Écarter les vêtements', 'compression'),
    compression: question('Une compression est-elle possible ?', [vers('Oui', 'manuelle'), vers('Non', 'zone')]),
    manuelle: question('Compression manuelle : quelle efficacité ?', [vers('Efficace', 'allonger'), vers('Efficace et besoin de se libérer', 'pansement'), vers('Inefficace', 'zone')]),
    pansement: question('Pansement compressif : quelle efficacité ?', [vers('Efficace', 'allonger'), vers('Inefficace – reprendre la compression manuelle', 'manuelle')]),
    zone: question('La zone est-elle garrotable ?', [vers('Oui', 'garrot'), vers('Non', 'gaze')]),
    garrot: action('Poser un garrot', 'allonger'),
    gaze: action('Gaze imbibée (SH), puis pansement compressif', 'allonger'),
    allonger: action('Allonger et réchauffer la victime', 'surveiller'),
    exteriorisee: question('Quelle est la localisation du saignement ?', [
      vers('Bouche', 'bouche'), vers('Oreille', 'oreille'), vers('Nez – choc minime', 'nezMinime'),
      vers('Nez – choc violent', 'nezViolent'), vers('Vaginale', 'vaginale'), vers('Anale', 'anale'),
    ]),
    bouche: action('Saignement de la bouche', 'surveiller', ['Allonger sur le côté.', 'En position assise si la victime ne supporte pas la position allongée ou présente une détresse respiratoire.']),
    oreille: question('Appliquer la conduite à tenir d’un traumatisme du crâne', [appeler('Ouvrir le logigramme traumatisme', '11', 'surveiller', 'agitation')]),
    nezViolent: question('Appliquer la conduite à tenir d’un traumatisme de la face', [appeler('Ouvrir le logigramme traumatisme', '11', 'surveiller')]),
    nezMinime: action('Saignement du nez après un choc minime', 'surveiller', ['Asseoir, tête penchée en avant.', 'Moucher fortement le nez.', 'Comprimer les narines 10 minutes.', 'Demander un avis médical si le saignement ne s’arrête pas.']),
    vaginale: action('Saignement vaginal', 'surveiller', ['Allonger ; si grossesse, de préférence sur le côté gauche.', 'Relever la couleur de l’écoulement.', 'Interroger sur la grossesse et les antécédents de grossesse pathologique.', 'Proposer des serviettes ou pansements absorbants entre les cuisses.']),
    anale: action('Saignement anal', 'surveiller', ['Allonger.', 'Proposer des serviettes ou pansements absorbants entre les fesses.']),
    surveiller: question('Surveiller l’efficacité et les signes de détresse circulatoire', [vers('Reprise d’une hémorragie externe', 'vetements'), vers('Poursuivre l’intervention sous surveillance', 'fin')]),
    fin: fin(),
  },
};

export const liberer: DefinitionLogigramme = {
  debut: 'corpsEtranger', etapes: {
    corpsEtranger: question('L’obstruction est-elle due à un corps étranger ?', [vers('Oui', 'toux'), vers('Non', 'quincke')]),
    toux: question('La victime tousse-t-elle efficacement ?', [vers('Oui', 'encourager'), vers('Non ou toux inefficace', 'conscience')]),
    encourager: question('Encourager la toux', [appeler('Mettre en position d’attente', '08', 'fin')]),
    conscience: question('La victime a-t-elle perdu connaissance ?', [aller('Oui – réanimer', '05', 'arret'), vers('Non', 'claques')]),
    claques: action('Effectuer 1 à 5 claques dans le dos', 'compressions'),
    compressions: question('Effectuer 1 à 5 compressions adaptées', [vers('Réévaluer la toux', 'toux')], ['Abdominales : adulte et enfant.', 'Thoraciques : nourrisson, personne obèse, femme enceinte, personne alitée ou difficilement mobilisable.']),
    quincke: question('L’obstruction est-elle due à un œdème de Quincke ?', [vers('Oui', 'traitement'), vers('Non', 'ventre')]),
    traitement: question('La victime demande-t-elle son traitement ?', [vers('Oui', 'medicament'), appeler('Non – prendre en charge la détresse respiratoire', '07', 'fin', 'respiratoire')]),
    medicament: action('Aider à la prise de médicaments', 'amelioration'),
    amelioration: question('Une amélioration est-elle constatée ?', [appeler('Oui – mettre en position d’attente', '08', 'fin'), appeler('Non – prendre en charge la détresse respiratoire', '07', 'fin', 'respiratoire'), vers('Pas d’amélioration dans les 5 minutes ou récidive – aider à nouveau à la prise du traitement', 'medicament')]),
    ventre: question('La victime est-elle sur le ventre ?', [vers('Oui – secouriste isolé ou situation non traumatique', 'retourner1'), vers('Oui – situation traumatique, en équipe', 'retourner2'), vers('Non', 'casque')]),
    retourner1: action('Retournement à un secouriste', 'casque', ['Pour pouvoir examiner la victime et pratiquer les gestes.']),
    retourner2: action('Retournement à deux secouristes', 'casque', ['Pour pouvoir examiner la victime et pratiquer les gestes.']),
    casque: question('Un casque empêche-t-il l’examen ou la réalisation des gestes ?', [vers('Oui – secouriste isolé', 'casque1'), vers('Oui – en équipe', 'casque2'), vers('Non', 'perteConnaissance')]),
    casque1: action('Retrait du casque à un secouriste', 'perteConnaissance'),
    casque2: action('Retrait du casque à deux secouristes', 'perteConnaissance'),
    perteConnaissance: question('La victime a-t-elle perdu connaissance ?', [vers('Oui', 'assise'), vers('Non', 'fin')]),
    assise: question('La victime est-elle assise ?', [vers('Oui', 'lvaAssise'), vers('Non', 'rachis')]),
    lvaAssise: action('Libérer les voies aériennes chez une victime assise', 'encombrement'),
    rachis: question('Existe-t-il un traumatisme du rachis ?', [vers('Oui', 'menton'), vers('Non', 'nonTraumatise')]),
    menton: action('Libérer les voies aériennes par élévation du menton', 'encombrement'),
    nonTraumatise: action('Libérer les voies aériennes chez un non traumatisé', 'encombrement', ['Adulte et enfant : bascule prudente.', 'Nourrisson : position neutre.']),
    encombrement: question('Les voies aériennes sont-elles encombrées ?', [vers('Oui', 'aspirer'), vers('Non', 'fin')]),
    aspirer: action('Aspirer les mucosités', 'fin'),
    fin: fin(),
  },
};
