# Healthcare Public Data: evidence and model applicability

Checked 29 October 2026 (Australia/Sydney). Scope: a fictional **adult** ICU teaching simulator for cerebral palsy (CP), Duchenne muscular dystrophy (DMD), assisted ventilation, manual bag ventilation and an explicitly authored arrest exercise.

## Retrieval provenance

The Healthcare Public Data plugin's **PubMed connector** was used for publication discovery, citation verification, identifier conversion, rights checks and eligible PMC body retrieval. Queries contained biomedical concepts and public bibliographic identifiers only. No personal Health records, participant records, patient names, drug claims or Medicare coverage datasets were used.

Operations performed:

- `pubmed_search_articles`: `"cerebral palsy"[Title/Abstract] AND adult*[Title/Abstract] AND ("vital capacity"[Title/Abstract] OR respiratory[Title/Abstract])` (relevance; first requested page of five).
- `pubmed_convert_article_ids`: `PMC11041593` mapped to PMID `38123347` and DOI `10.1136/thorax-2023-220811`.
- `pubmed_get_articles`: PMIDs `39048148`, `36921894`, `38123347`, `25525345`.
- `pubmed_search_articles`: `"Adult Basic Life Support"[Title] AND "2020 International Consensus"[Title] AND Olasveengen[Author]`.
- `pubmed_get_copyright_status`: PMIDs `38123347` and `25525345`; both were reported eligible for automated PMC retrieval.
- `pubmed_get_full_text_articles`: `PMC4267512` body retrieved completely (14,629 characters); `PMC11041593` body retrieved in two successive pages, offsets 0 and 30,000 (38,076 characters total). The first DMD page was truncated and was continued before treating its body as fully retrieved.

This was **targeted corroboration, not a systematic or exhaustive review**. The CP search reported 113 matches and returned two hydrated records from the requested first page, with a continuation offset. Remaining search pages were not reviewed. Some author/keyword/MeSH arrays were bounded; these did not truncate the abstracts or the two retrieved article bodies. Full article text is not bundled in this project; the original summaries below link to source publications.

## Evidence mapped to the simulator

### 1. CP: lung volume and saturation measure different things

**Lampe R, Blumenstein T, Turova V, Alves-Pinto A.** Lung vital capacity and oxygen saturation in adults with cerebral palsy. *Patient Preference and Adherence*. 2014;8:1691–1697. PMID **25525345**; PMCID **PMC4267512**; DOI **10.2147/PPA.S72575**.

[PubMed citation](https://pubmed.ncbi.nlm.nih.gov/25525345/) · [PMC body](https://pmc.ncbi.nlm.nih.gov/articles/PMC4267512/)

This small observational rehabilitation-centre study associated reduced vital capacity with restricted chest expansion and greater motor impairment; scoliosis was associated with additional restriction. Oxygen saturation was often preserved despite reduced lung volumes. The cohort contained 46 adults, including four people with acquired tetraparesis after traumatic brain injury, which limits a CP-only interpretation.

**Internal source caution:** the abstract broadly describes saturation as normal in all participants, but the body conclusion reports four participants with values of 90–94%. The defensible teaching point is that apparently reassuring saturation can coexist with reduced respiratory reserve, not that saturation is always normal in CP. The study did not measure the simulator's static compliance, validate its parameter values, or establish that every person with CP develops respiratory failure. The authors' explanations involving training or physiological adaptation should not be treated as experimentally proven mechanisms.

**Model application:** use editable individual chest-wall/respiratory modifiers and separate oxygenation from respiratory mechanics. Do not convert measured vital capacity directly into a compliance constant.

### 2. DMD: separate ventilation, secretion clearance and cardiac involvement

**Childs A-M, Turner C, Astin R, et al.** Development of respiratory care guidelines for Duchenne muscular dystrophy in the UK: key recommendations for clinical practice. *Thorax*. 2024;79(5):476–485. PMID **38123347**; PMCID **PMC11041593**; DOI **10.1136/thorax-2023-220811**. PubMed records the issue publication on 15 April 2024; the PMC record also identifies online publication in December 2023.

[PubMed citation](https://pubmed.ncbi.nlm.nih.gov/38123347/) · [PMC body](https://pmc.ncbi.nlm.nih.gov/articles/PMC11041593/)

This UK consensus guidance, endorsed by the BTS, describes inspiratory and expiratory muscle weakness, nocturnal hypoventilation, ineffective cough, secretion retention and possible cardiac involvement. It warns that daytime saturation alone does not establish adequate ventilation. Acute assessment includes CO₂ and attention to possible cardiac dysfunction; specialist input and patient preferences remain relevant to airway decisions.

**Model application:** retain separate muscle-effort, secretion, gas-exchange and cardiac-reserve assumptions. FiO₂ changes must not directly clear CO₂. DMD is a specific diagnosis: its cardiac and respiratory trajectory must not be applied to every muscular dystrophy. The guideline is not a numerical calibration dataset, an Australian local protocol, evidence that tracheostomy is inevitable, or a source of individual prognosis.

### 3. Broader neuromuscular guidance: limited transferable evidence

**Khan A, Frazer-Green L, Amin R, et al.** Respiratory Management of Patients With Neuromuscular Weakness: An American College of Chest Physicians Clinical Practice Guideline and Expert Panel Report. *Chest*. 2023;164(2):394–413. PMID **36921894**; DOI **10.1016/j.chest.2023.03.011**.

[PubMed citation and abstract](https://pubmed.ncbi.nlm.nih.gov/36921894/)

The panel reviewed 128 studies and explicitly described the evidence as limited and primarily observational in ALS. The guidance emphasises heterogeneous neuromuscular disorders, individual respiratory goals, bedside assessment and shared decisions. This supports a configurable case architecture and specialist review; it does not justify a universal CP/MD trajectory or claims that this simulator predicts treatment response. Only citation metadata and the complete abstract were retrieved through the connector for this source.

### 4. Patient–ventilator assessment: observe the person and the delivered support

**Goodfellow LT, Miller AG, Varekojis SM, et al.** AARC Clinical Practice Guideline: Patient-Ventilator Assessment. *Respiratory Care*. 2024;69(8):1042–1054. PMID **39048148**; PMCID **PMC11298231**; DOI **10.4187/respcare.12007**.

[PubMed citation and abstract](https://pubmed.ncbi.nlm.nih.gov/39048148/)

The guideline supports assessment of delivered volume, plateau pressure, PEEP/auto-PEEP, oxygen support, humidification, airway securement and skin. This corroborates the simulator's observation and care domains. It does not validate its equations or establish that an estimated elastic pressure equals a measured plateau pressure. Parameter bounds remain software exploration limits. The connector retrieved citation metadata and the complete abstract; the official AARC guideline was separately reviewed via its public website.

### 5. CPR evidence: contextual support for ANZCOR, not a replacement for it

**Olasveengen TM, Mancini ME, Perkins GD, et al.** Adult Basic Life Support: 2020 International Consensus on Cardiopulmonary Resuscitation and Emergency Cardiovascular Care Science With Treatment Recommendations. *Circulation*. 2020;142(16_suppl_1):S41–S91. PMID **33084391**; DOI **10.1161/CIR.0000000000000892**.

[PubMed citation and abstract](https://pubmed.ncbi.nlm.nih.gov/33084391/)

PubMed confirms this ILCOR consensus evaluated 22 prioritised BLS topics. The record corroborates the evidence framework cited by ANZCOR, rather than independently validating the simulator's CPR feedback or outcomes. The connector supplied metadata and the complete abstract. Contemporary Australian implementation details were checked against the official ANZCOR pages below, not inferred from an abstract or imported wholesale from another jurisdiction.

## Australian resuscitation source boundary

- [ANZCOR Guideline 6 — Compressions](https://www.anzcor.org/home/basic-life-support/guideline-6-compressions): recognition uses unresponsiveness and absent normal breathing; pulse palpation is not a required certainty gate. Rate 100–120/min; the text describes adult depth beyond 5 cm and expressly declines an upper depth limit. The simulator's broader control limits are not clinical targets.
- [ANZCOR Guideline 8 — CPR](https://www.anzcor.org/home/basic-life-support/guideline-8-cardiopulmonary-resuscitation-cpr): early CPR, help, defibrillation and minimal interruptions; the basic compression–ventilation sequence is 30:2.
- [ANZCOR Guideline 11.6 — Equipment and Techniques in Adult ALS](https://www.anzcor.org/home/adult-advanced-life-support/guideline-11-6-equipment-and-techniques-in-adult-advanced-life-support): approved April 2025. Distinguishes 30:2 without an advanced airway from ventilation through an established advanced airway during continuing compressions, with a stated 6–10/min ventilation range. Device use requires trained personnel. The webpage's 2026 citation year is not the approval date.

These sources support adult resuscitation content boundaries. They do **not** establish numerical compression-generated flow, arterial gas kinetics in low-flow states, survival probabilities, ROSC prediction, or clinical competence from completion of this software exercise.

## Consequences for development and review

Keep diagnosis, individual baseline, acute impairment, communication access and system readiness separate. A known patient response or reviewed plan must not imply agreement to a new planned intervention. Urgent assessment and escalation remain available when AAC fails. A bag breath must use the existing mechanical model without automatically clearing obstruction; compression-generated flow must remain distinct from spontaneous circulation. Evidence from these publications supports the teaching topics, while the chosen constants and response kinetics remain declared engineering assumptions requiring clinical and lived-experience review.
