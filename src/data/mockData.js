// data/mockData.js

/**
 * Mock source texts for the cipher deciphering tool
 * These are abbreviated versions - in production, would contain full texts
 */
export const MOCK_SOURCES = [
  // ==================== MARLOWE PLAYS ====================
  {
    id: 'faustus_a1_1604',
    title: 'Doctor Faustus A-text',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1604,
    edition: 'A1',
    character_count: 12847,
    source_authority: 'Folger Shakespeare Library',
    text: `The Tragicall History of D. Faustus.
As it hath bene Acted by the Right Honorable the Earle of Nottingham his seruants.
Written by Ch. Marklin.

Enter Faustus in his study.

Faustus. Settle thy studies Faustus, and beginne
To sound the depth of that thou wilt professe:
Hauing commenc'd, be a Diuine in shew,
Yet leuell at the end of euery Art,
And liue and die in Aristotles workes.
Sweet Annalitickes tis thou hast rauisht me,
Bene disserere est finis logices.
Is to dispute well Logickes chiefest end,
Affoords this Art no greater miracle?
Then reade no more, thou hast attain'd that end:
A greater subiect fitteth Faustus wit.
Bid on kai me on farewell, Galen come:
Seeing vbi desinit philosophus, ibi incipit medicus,
Be a physition Faustus, heape vp gold,
And be eterniz'd for some wondrous cure.
Summum bonum medicine sanitas:
The end of physicke is our bodies health:
Why Faustus hast thou not attain'd that end?
Is not thy common talke sound Aphorismes?
Are not thy billes hung vp as monuments,
Whereby whole Cities haue escapt the plague,
And thousand desperate maladies beene eas'd?
Yet art thou still but Faustus, and a man.
Couldst thou make men to liue eternally,
Or being dead, raise them to life againe,
Then this profession were to be esteem'd.
Physicke farewell: where is Iustinian?
Si una eademque res legatur duobus,
Alter rem alter valorem rei, &c.
A petty case of paltry Legacies.
Exhereditare filium non potest pater nisi, &c.
Such is the subiect of the Institute,
And vniuersall body of the Law:
This study fits a mercenary drudge,
Who aimes at nothing but externall trash,
Too seruile and illiberall for me.
When all is done, Diuinitie is best.
Ieromes Bible Faustus, view it well:
Stipendium peccati mors est: ha, Stipendium, &c.
The reward of sinne is death? that's hard.
Si peccasse negamus, fallimur, & nulla est in nobis veritas.
If we say that we haue no sinne,
We deceiue our selues, and there's no truth in vs.
Why then belike we must sinne,
And so consequently die.
I, we must die an euerlasting death.
What doctrine call you this, Che sera, sera:
What will be, shall be? Diuinitie adiew.
These Metaphisickes of Magitians,
And Negromantike bookes are heauenly.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.95,
      total_lines: 247,
    },
  },

  {
    id: 'faustus_b1_1616',
    title: 'Doctor Faustus B-text',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1616,
    edition: 'B1',
    character_count: 15231,
    source_authority: 'Folger Shakespeare Library',
    text: `The Tragicall History of the Life and Death of Doctor Faustus.
With new Additions.
Written by Ch. Marlin.

Prologue.
Enter Chorus.

Chorus. Not marching now in fields of Thracimen,
Where Mars did mate the Carthaginians,
Nor sporting in the dalliance of loue,
In courts of Kings where state is ouerturnd,
Nor in the pompe of proud audacious deeds,
Intends our Muse to daunt his heauenly verse:
Onely this (Gentlemen) we must performe,
The forme of Faustus fortunes good or bad,
To patient iudgements we appeale our plaud,
And speake for Faustus in his infancie:
Now is he borne, his parents base of stocke,
In Germany, within a Towne call'd Rhodes;
Of riper yeeres to Wertenberg he went,
Whereas his kinsmen chiefly brought him vp,
So soone he profits in Diuinitie,
The fruitfull plot of Scholerisme grac't,
That shortly he was grac't with Doctors name,
Excelling all, whose sweete delight disputes
In heauenly matters of Theologie,
Till swolne with cunning, of a selfe conceit,
His waxen wings did mount aboue his reach,
And melting heauens conspir'd his ouerthrow.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: ['probable interpolations', 'additions by other hands'],
      quality_score: 0.82,
      total_lines: 312,
    },
  },

  {
    id: 'edward_ii_1594',
    title: 'Edward II',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1594,
    edition: 'Q1',
    character_count: 18942,
    source_authority: 'British Library',
    text: `The troublesome raigne and lamentable death of Edward the second, King of England: with the tragicall fall of proud Mortimer.
As it was sundrie times publiquely acted in the honourable citie of London, by the right honourable the Earle of Pembrooke his seruants.
Written by Chri. Marlowe Gent.

Enter Gaueston reading on a letter that was brought him from the king.

Gaueston. My father is deceast, come Gaueston,
And share the kingdome with thy dearest friend.
Ah words that make me surfet with delight:
What greater blisse can hap to Gaueston,
Then liue and be the fauorit of a king?
Sweete prince I come, these these thy amorous lines,
Might haue enforst me to haue swum from France,
And like Leander gaspt vpon the sande,
So thou wouldst smile and take me in thy armes.
The sight of London to my exiled eyes,
Is as Elysium to a new come soule.
Not that I loue the citie or the men,
But that it harbors him I hold so deare,
The king, vpon whose bosome let me die,
And with the world be still at enmitie:
What neede the artick people loue star-light,
To whom the sunne shines both by day and night.
Farewell base stooping to the lordly peeres,
My knee shall bowe to none but to the king.
As for the multitude that are but sparkes,
Rakt vp in embers of their pouertie,
Tanti: Ile fawne first on the winde,
That glanceth at my lips and flieth away.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.91,
      total_lines: 456,
    },
  },

  {
    id: 'jew_of_malta_1633',
    title: 'The Jew of Malta',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1633,
    edition: 'Q1',
    character_count: 16523,
    source_authority: 'British Library',
    text: `The Famous Tragedy of the Rich Iew of Malta.
As it was Playd before the King and Queene, in his Maiesties Theatre at White-Hall, by her Maiesties Seruants at the Cock-pit.
Written by Christopher Marlo.

Machiauell. Albeit the world thinke Machiauell is dead,
Yet was his soule but flowne beyond the Alpes,
And now the Guize is dead, is come from France
To view this Land, and frolicke with his friends.
To some perhaps my name is odious,
But such as loue me, garde me from their tongues,
And let them know that I am Machiauell,
And weigh not men, and therefore not mens words:
Admir'd I am of those that hate me most.
Though some speake openly against my bookes,
Yet will they reade me, and thereby attaine
To Peters Chayre: And when they cast me off,
Are poyson'd by my climing followers.
I count Religion but a childish Toy,
And hold there is no sinne but Ignorance.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: ['late publication', 'possible revisions'],
      quality_score: 0.78,
      total_lines: 389,
    },
  },

  {
    id: 'tamburlaine_1590',
    title: 'Tamburlaine the Great (Part I)',
    author: 'Christopher Marlowe',
    category: 'marlowe_plays',
    publication_year: 1590,
    edition: 'Q1',
    character_count: 19234,
    source_authority: 'British Library',
    text: `Tamburlaine the Great.
Who, from a Scythian Shephearde, by his rare and woonderfull Conquests, became a most puissant and mightye Monarque.
And (for his tyrannie, and terrour in Warre) was tearmed, The Scourge of God.
Deuided into two Tragicall Discourses, as they were sundrie times shewed vpon Stages in the Citie of London.
By the right honourable the Lord Admyrall, his seruantes.
Now first, and newlie published.

Prologue.

From iygging vaines of riming mother wits,
And such conceits as clownage keepes in pay,
Weele leade you to the stately tent of War:
Where you shall heare the Scythian Tamburlaine,
Threatning the world with high astounding tearms
And scourging kingdomes with his conquering sword.
View but his picture in this tragicke glasse,
And then applaud his fortunes as you please.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.93,
      total_lines: 521,
    },
  },

  // ==================== MARLOWE POETRY ====================
  {
    id: 'hero_leander_1598',
    title: 'Hero and Leander',
    author: 'Christopher Marlowe',
    category: 'marlowe_poetry',
    publication_year: 1598,
    edition: 'Q1',
    character_count: 8934,
    source_authority: 'Folger Shakespeare Library',
    text: `Hero and Leander.
By Christopher Marloe.

On Hellespont guiltie of True-loues blood,
In view and opposit two citties stood,
Seaborderers, disioin'd by Neptunes might:
The one Abydos, the other Sestos hight.
At Sestos, Hero dwelt, Hero the faire,
Whom young Apollo courted for her haire,
And offred as a dower his burning throne,
Where she should sit for men to gaze vpon.
The outside of her garments were of lawne,
The lining, purple silke, with guilt starres drawne,
Her wide sleeues greene, and bordered with a groue,
Where Venus in her naked glory stroue,
To please the careles and disdainfull eies,
Of proud Adonis that before her lies.
Her kirtle blew, whereon was many a staine,
Made with the blood of wretched Louers slaine.
Vpon her head she ware a myrtle wreath,
From whence her vaile reacht to the ground beneath.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['completed by Chapman'],
      quality_score: 0.89,
      total_lines: 484,
    },
  },

  {
    id: 'ovid_elegies_1595',
    title: "Ovid's Elegies (All Ovids Elegies)",
    author: 'Christopher Marlowe (translator)',
    category: 'marlowe_poetry',
    publication_year: 1595,
    edition: 'Q1',
    character_count: 7123,
    source_authority: 'British Library',
    text: `All Ovids Elegies.
Translated by C. M.

Elegia I.

Ad Riualem.

Thy husband to a banket goes with me,
Pray God it may his latest supper be,
Shall I sit gazing as a bashfull guest,
While others touch the damsel I loue best?
Wilt lying vnder him, his bosome clip?
About thy neck shall he at pleasure skip?
Marueile not, though the faire Bride did incite,
The drunken Centaures to a sodaine fight.
I am no halfe horse, nor in woods I dwell,
Yet scarse my hands from thee containe I well.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['censored', 'burned by authorities'],
      quality_score: 0.85,
      total_lines: 156,
    },
  },

  // ==================== SPANISH TRAGEDY ====================
  {
    id: 'spanish_tragedy_1592',
    title: 'The Spanish Tragedy',
    author: 'Thomas Kyd (attributed)',
    category: 'spanish_tragedy',
    publication_year: 1592,
    edition: 'Q1',
    character_count: 16234,
    source_authority: 'British Library',
    text: `THE SPANISH TRAGEDIE, Containing the lamentable end of Don Horatio, and Belimperia: with the pittifull death of olde Hieronimo.
Newly corrected and amended of such grosse faults as passed in the first impression.

Enter the Ghost of Andrea, and with him Reuenge.

Andrea. When this eternall substance of my soule
Did liue imprisond in my wanton flesh,
Each in their function seruing others neede,
I was a Courtier in the Spanish Court:
My name was Don Andrea, my descent
Though not ignoble, yet inferiour far
To gratious fortunes of my tender youth:
For there in prime and pride of all my yeeres,
By duteous seruice and deseruing loue,
In secrete I possest a worthy Dame,
Which hight sweete Bel-imperia by name.
But in the haruest of my sommer ioyes,
Deaths winter nipt the blossomes of my blisse,
Forcing diuorce betwixt my loue and me.
For in the late conflict with Portingale,
My valour drew me into dangers mouth,
Till life to death made passage through my wounds.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.88,
      total_lines: 378,
    },
  },

  // ==================== SHAKESPEARE QUARTOS ====================
  {
    id: 'hamlet_q1_1603',
    title: 'Hamlet Q1 (Bad Quarto)',
    author: 'William Shakespeare',
    category: 'shakespeare_tragedies',
    publication_year: 1603,
    edition: 'Q1',
    character_count: 14523,
    source_authority: 'Folger Shakespeare Library',
    text: `THE Tragicall Historie of HAMLET Prince of Denmarke
By William Shake-speare.
As it hath beene diuerse times acted by his Highnesse seruants in the Cittie of London: as also in the two Vniuersities of Cambridge and Oxford, and else-where.

Enter two Centinels.

1. Stand: who is that?
2. Tis I.
1. O you come most carefully vpon your watch,
2. And if you meete Marcellus and Horatio,
The partners of my watch, bid them make haste.
1. I will: See who goes there.

Enter Horatio and Marcellus.

Hor. Friends to this ground.
Mar. And leegemen to the Dane,
O farewell honest souldier, who hath relieued you?
1. Bernardo hath my place, giue you good night.
Mar. Holla, Bernardo.
2. Say, is Horatio there?
Hor. A peece of him.
2. Welcome Horatio, welcome good Marcellus.
Mar. What hath this thing appeard againe to night.
2. I haue seene nothing.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['memorial reconstruction suspected', 'textual variants'],
      quality_score: 0.65,
      total_lines: 289,
    },
  },

  {
    id: 'hamlet_q2_1604',
    title: 'Hamlet Q2 (Good Quarto)',
    author: 'William Shakespeare',
    category: 'shakespeare_tragedies',
    publication_year: 1604,
    edition: 'Q2',
    character_count: 28947,
    source_authority: 'Folger Shakespeare Library',
    text: `THE Tragicall Historie of HAMLET, Prince of Denmarke.
By William Shakespeare.
Newly imprinted and enlarged to almost as much againe as it was, according to the true and perfect Coppie.

Enter Barnardo and Francisco two Centinels.

Bar. Who's there?
Fran. Nay answere me: Stand and vnfold your selfe.
Bar. Long liue the King.
Fran. Barnardo.
Bar. He.
Fran. You come most carefully vpon your houre,
Bar. Tis now strooke twelfe, get thee to bed Francisco.
Fran. For this reliefe much thanks, tis bitter cold,
And I am sicke at hart.
Bar. Haue you had quiet guard?
Fran. Not a mouse stirring.
Bar. Well, good night:
If you doe meete Horatio and Marcellus,
The riualls of my watch, bid them make hast.

Enter Horatio and Marcellus.

Fran. I thinke I heare them, stand ho, who is there?
Hor. Friends to this ground.
Mar. And Leedgemen to the Dane.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: 0.93,
      total_lines: 623,
    },
  },

  {
    id: 'romeo_q1_1597',
    title: 'Romeo and Juliet Q1',
    author: 'William Shakespeare',
    category: 'shakespeare_tragedies',
    publication_year: 1597,
    edition: 'Q1',
    character_count: 12456,
    source_authority: 'British Library',
    text: `An Excellent conceited Tragedie of Romeo and Iuliet.
As it hath been often (with great applause) plaid publiquely, by the right Honourable the L. of Hunsdon his Seruants.

Enter Chorus.

Two housholdes both alike in dignitie,
(In faire Verona where we lay our Scene)
From ciuill broyles broke into enmitie,
Whose ciuill warre makes ciuill hands vncleane.
From forth the fatall loynes of these two foes,
A paire of starre-crost Louers take their life:
Whose misaduentures, piteous ouerthrowes,
(Through the continuing of their Fathers strife,
And death-markt passage of their Parents rage)
Is now the two houres traffique of our Stage.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['possible memorial reconstruction'],
      quality_score: 0.72,
      total_lines: 234,
    },
  },

  {
    id: 'richard_iii_q1_1597',
    title: 'Richard III Q1',
    author: 'William Shakespeare',
    category: 'shakespeare_histories',
    publication_year: 1597,
    edition: 'Q1',
    character_count: 15678,
    source_authority: 'Folger Shakespeare Library',
    text: `The Tragedy of King Richard the third.
Containing, His treacherous Plots against his brother Clarence: the pittiefull murther of his innocent nephewes: his tyrannicall vsurpation: with the whole course of his detested life, and most deserued death.
As it hath beene lately Acted by the Right honourable the Lord Chamberlaine his seruants.

Enter Richard Duke of Gloster solus.

Rich. Now is the winter of our discontent,
Made glorious summer by this sonne of Yorke:
And all the cloudes that lowrd vpon our house,
In the deepe bosome of the Ocean buried.
Now are our browes bound with victorious wreathes,
Our bruised armes hung vp for monuments:
Our sterne alarmes changd to merry meetings,
Our dreadfull marches, to delightfull measures:
Grim-visagd warre, hath smoothde his wrinkled front:
And now in steede of mounting barbed steedes,
To fright the soules of fearefull aduersaries,
He capers nimbly in a Ladies chamber,
To the lasciuious pleasing of a Lute.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: 0.89,
      total_lines: 401,
    },
  },

  {
    id: 'venus_adonis_1593',
    title: 'Venus and Adonis',
    author: 'William Shakespeare',
    category: 'shakespeare_poetry',
    publication_year: 1593,
    edition: 'Q1',
    character_count: 9876,
    source_authority: 'Folger Shakespeare Library',
    text: `VENUS AND ADONIS
Vilia miretur vulgus: mihi flauus Apollo
Pocula Castalia plena ministret aqua.

TO THE RIGHT HONOVRABLE Henrie Vvriothesley, Earle of Southampton, and Baron of Titchfield.

Right Honourable, I know not how I shall offend in dedicating my vnpolisht lines to your Lordship, nor how the worlde will censure mee for choosing so strong a proppe to support so weake a burthen, onelye if your Honour seeme but pleased, I account my selfe highly praised, and vowe to take aduantage of all idle houres, till I haue honoured you with some grauer labour. But if the first heire of my inuention proue deformed, I shall be sorie it had so noble a god-father: and neuer after eare so barren a land, for feare it yeeld me still so bad a haruest, I leaue it to your Honourable suruey, and your Honor to your hearts content which I wish may alwaies answere your owne wish, and the worlds hopefull expectation.

Your Honors in all dutie,
William Shakespeare.

Euen as the sunne with purple colourd face,
Had tane his last leaue of the weeping morne,
Rose-cheekt Adonis hied him to the chace,
Hunting he loued, but loue he laught to scorne:
Sick-thoughted Venus makes amaine vnto him,
And like a bold fac'd suter ginnes to woe him.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: 0.97,
      total_lines: 199,
    },
  },

  // ==================== KING JAMES BIBLE ====================
  {
    id: 'kjv_genesis_1611',
    title: 'King James Bible - Genesis',
    author: 'Various translators',
    category: 'bible',
    publication_year: 1611,
    edition: '1st Edition',
    character_count: 45678,
    source_authority: 'Cambridge University',
    text: `THE FIRST BOOKE OF Moses, called GENESIS.

CHAP. I.

1 In the beginning God created the Heauen, and the Earth.
2 And the earth was without forme, and voyd, and darkenesse was vpon the face of the deepe: and the Spirit of God mooued vpon the face of the waters.
3 And God said, Let there be light: and there was light.
4 And God saw the light, that it was good: and God diuided the light from the darkenesse.
5 And God called the light, Day, and the darknesse he called Night: and the euening and the morning were the first day.
6 And God said, Let there be a firmament in the midst of the waters: and let it diuide the waters from the waters.
7 And God made the firmament; and diuided the waters, which were vnder the firmament, from the waters, which were aboue the firmament: and it was so.
8 And God called the firmament, Heauen: and the euening and the morning were the second day.
9 And God said, Let the waters vnder the heauen be gathered together vnto one place, and let the dry land appeare: and it was so.
10 And God called the drie land, Earth, and the gathering together of the waters called hee, Seas: and God saw that it was good.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.99,
      total_lines: 1533,
    },
  },

  {
    id: 'kjv_psalms_1611',
    title: 'King James Bible - Psalms',
    author: 'Various translators',
    category: 'bible',
    publication_year: 1611,
    edition: '1st Edition',
    character_count: 67890,
    source_authority: 'Cambridge University',
    text: `THE BOOKE OF PSALMES.

PSALME I.

1 Blessed is the man that walketh not in the counsell of the vngodly, nor standeth in the way of sinners: nor sitteth in the seat of the scornefull.
2 But his delight is in the Law of the LORD: and in his Law doeth he meditate day and night.
3 And he shall be like a tree planted by the riuers of water, that bringeth foorth his fruite in his season: his leafe also shall not wither, and whatsoeuer he doeth, shall prosper.
4 The vngodly are not so: but are like the chaffe which the winde driueth away.
5 Therefore the vngodly shall not stand in the iudgement: nor sinners in the congregation of the righteous.
6 For the LORD knoweth the way of the righteous: but the way of the vngodly shall perish.

PSALME XXIII.

1 The LORD is my shepheard, I shall not want.
2 He maketh me to lie downe in greene pastures: he leadeth mee beside the still waters.
3 He restoreth my soule: he leadeth me in the pathes of righteousnesse, for his Names sake.
4 Yea though I walke through the valley of the shadowe of death, I will feare no euill: for thou art with me, thy rod and thy staffe, they comfort me.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.99,
      total_lines: 2461,
    },
  },

  // ==================== OTHER ELIZABETHAN TEXTS ====================
  {
    id: 'sidney_astrophel_1591',
    title: 'Astrophel and Stella',
    author: 'Sir Philip Sidney',
    category: 'poetry',
    publication_year: 1591,
    edition: 'Q1',
    character_count: 8234,
    source_authority: 'British Library',
    text: `Astrophel and Stella.
Wherein the excellence of sweete Poesie is concluded.
To the end of which are added, sundry other rare Sonnets of diuers Noble men and Gentlemen.

Sonnet 1.

Louing in truth, and faine in verse my loue to show,
That the deare Shee might take some pleasure of my paine:
Pleasure might cause her reade, reading might make her know,
Knowledge might pitie winne, and pitie grace obtaine,
I sought fit wordes to paint the blackest face of woe,
Studying inuentions fine, her wits to entertaine:
Oft turning others leaues, to see if thence would flow
Some fresh and fruitfull showers vpon my sunne-burn'd braine.
But wordes came halting forth, wanting Inuentions stay,
Inuention, Natures child, fled step-dame Studies blowes,
And others feete still seem'd but strangers in my way.
Thus great with child to speake, and helplesse in my throwes,
Biting my trewand pen, beating my selfe for spite,
Foole, said my Muse to me, looke in thy heart and write.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: ['posthumous publication'],
      quality_score: 0.91,
      total_lines: 108,
    },
  },

  {
    id: 'spenser_faerie_queene_1590',
    title: 'The Faerie Queene (Book I)',
    author: 'Edmund Spenser',
    category: 'poetry',
    publication_year: 1590,
    edition: 'Q1',
    character_count: 34567,
    source_authority: 'Folger Shakespeare Library',
    text: `THE FAERIE QVEENE.
Disposed into twelue books, Fashioning XII. Morall vertues.

LONDON
Printed for William Ponsonbie. 1590.

TO THE MOST HIGH, MIGHTIE And MAGNIFICIENT EMPRESSE RENOVV-MED FOR PIETIE, VER-TVE, AND ALL GRATIOVS GOVERNMENT ELIZABETH BY THE GRACE OF GOD QVEENE OF ENGLAND FRAVNCE AND IRELAND AND OF VIRGI-NIA, DEFENDOVR OF THE FAITH, &c. Her most humble Seruant: Ed. Spenser doth in all humilitie dedi-cate, present and consecrate these his labours to liue with the eternitie of her fame.

THE FIRST BOOKE OF THE FAERIE QVEENE.
Contayning The Legende of the Knight of the Red Crosse, or Of Holinesse.

Lo I the man, whose Muse whilome did maske,
As time her taught in lowly Shepheards weeds,
Am now enforst a far vnfitter taske,
For trumpets sterne to chaunge mine Oaten reeds:
And sing of Knights and Ladies gentle deeds,
Whose prayses hauing slept in silence long,
Me, all too meane, the sacred Muse areeds
To blazon broad emongst her learned throng:
Fierce warres and faithfull loues shall moralize my song.`,
    metadata: {
      contains_blackletter: true,
      corruption_flags: [],
      quality_score: 0.94,
      total_lines: 789,
    },
  },

  {
    id: 'nashe_unfortunate_1594',
    title: 'The Unfortunate Traveller',
    author: 'Thomas Nashe',
    category: 'prose',
    publication_year: 1594,
    edition: 'Q1',
    character_count: 23456,
    source_authority: 'British Library',
    text: `The Unfortunate Traveller. Or, The life of Jacke Wilton.
Newly corrected and augmented.

To the Right Honourable Lord Henry Wriothesley, Earle of Southampton, and Baron of Titchfield.

Ingenuous honourable Lord, I know not what blinde custome methodicall antiquity hath thrust vpon vs, to dedicate such bookes as wee publish to one great man or other. In which respect, lest any man should challenge these my papers as goods uncustomed, and so extend vpon them as forfeit to contempt, I thought best to acquaint your Lordship with this my newe enterprise.

About that time that the terror of the world and feauer quartane of the French, Henry the eight (the only true subiect of Chronicles) aduanced his standard against the two hundred and fifty towres of Turney and Turwin, and had the Emperour and all the nobility of Flaunders, Holland and Brabant come to do him homage at Tournehem and Tourwin: I, Jacke Wilton, (a Gentleman at least) was a certaine kind of an appendix or page, belonging or appertaining in or vnto the confines of the English court: where what my credit was, a number of my creditors that I cozened can testifie.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: 0.87,
      total_lines: 456,
    },
  },

  // ==================== SAMPLE CUSTOM UPLOADS ====================
  {
    id: 'user_upload_example_1',
    title: 'User Upload - Example Text',
    author: 'Unknown',
    category: 'user_uploads',
    publication_year: null,
    edition: null,
    character_count: 245,
    source_authority: 'User uploaded',
    text: `This is an example of a user-uploaded text that would appear in the library after someone uploads their own document. It could be any Elizabethan text they want to analyze for cipher patterns.`,
    metadata: {
      contains_blackletter: false,
      corruption_flags: [],
      quality_score: null,
      total_lines: 3,
    },
  },
];

/**
 * Mock entity dictionary for cipher detection
 * Based on Roberta's research and historical figures relevant to Marlowe
 */
export const MOCK_ENTITIES = [
  // ==================== PRIMARY ENTITIES (Post-1593) ====================
  {
    id: 1,
    name: 'John Whitgift',
    name_variants: ['Whitgift', 'Whitgifte', 'Archbishop Whitgift', 'Whitgift Archbishop'],
    entity_type: 'person',
    time_period: 'post_1583',
    biographical_data: {
      birth_year: 1530,
      death_year: 1604,
      roles: ['Archbishop of Canterbury', 'Privy Councillor'],
      key_events: [
        'Appointed Archbishop 1583',
        'Persecuted Puritans',
        'Star Chamber proceedings',
      ],
      relationships: [
        { entity: 'Hen', type: 'persecutor-victim', confidence: 0.95 },
        { entity: 'Roger Manwood', type: 'persecutor-victim', confidence: 0.90 },
        { entity: 'hoohoo', type: 'advisor-monarch', confidence: 0.85 },
      ],
    },
    importance_weight: 1.0,
    theme_associations: ['persecution', 'torture', 'imprisonment', 'religious_persecution', 'star_chamber'],
    historical_notes: 'Most powerful persecutor in Marlowe era. Central figure in Roberta\'s thesis.',
  },

  {
    id: 2,
    name: 'hoohoo',
    name_variants: ['hoohoo', 'hoohu', 'hoo hoo', 'Elizabeth I', 'Elizabeth'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1533,
      death_year: 1603,
      roles: ['Queen of England', 'Supreme Governor of Church'],
      key_events: [
        'Ascended throne 1558',
        'Excommunicated 1570',
        'Executed Mary Queen of Scots 1587',
      ],
      relationships: [
        { entity: 'Edward de Vere', type: 'alleged-scandal', confidence: 0.80 },
        { entity: 'Leicester', type: 'rumored-relationship', confidence: 0.75 },
        { entity: 'Whitgift', type: 'monarch-advisor', confidence: 0.90 },
      ],
    },
    importance_weight: 0.95,
    theme_associations: ['royal_scandal', 'incest', 'succession', 'bastard', 'secret_child'],
    historical_notes: 'Code name in Roberta\'s research. Alleged mother of Oxford\'s child.',
  },

  {
    id: 3,
    name: 'Hen',
    name_variants: ['Hen', 'Henry', 'Henrie'],
    entity_type: 'person',
    time_period: 'post_1583',
    biographical_data: {
      birth_year: null,
      death_year: 1593,
      roles: ['Alleged victim of persecution'],
      key_events: [
        'Persecuted by Whitgift',
        'Imprisoned',
        'Died 1593',
      ],
      relationships: [
        { entity: 'Whitgift', type: 'victim-persecutor', confidence: 0.95 },
      ],
    },
    importance_weight: 0.90,
    theme_associations: ['persecution', 'imprisonment', 'torture', 'death', 'victim'],
    historical_notes: 'Mysterious figure in cipher patterns. Possibly Henry Barrow or other Puritan victim.',
  },

  {
    id: 4,
    name: 'Marina Cicogna',
    name_variants: ['Marina', 'Cicogna', 'Marina Cicogna', 'Marina Cicogna Dolfin'],
    entity_type: 'person',
    time_period: 'post_1593',
    biographical_data: {
      birth_year: 1567,
      marriage_year: 1593,
      roles: ['Venetian noblewoman', 'Wife of Duke'],
      key_events: [
        'Married Giovanni Cicogna 1593',
        'Alleged relationship with Marlowe',
      ],
      relationships: [
        { entity: 'Giovanni Cicogna', type: 'husband', confidence: 1.0 },
        { entity: 'Christopher Marlowe', type: 'alleged-relationship', confidence: 0.70 },
      ],
    },
    importance_weight: 0.80,
    theme_associations: ['venice', 'marriage', 'family', 'exile', 'refuge'],
    historical_notes: 'Roberta\'s theory: Marlowe fled to Venice, married Marina.',
  },

  {
    id: 5,
    name: 'Edward de Vere',
    name_variants: ['de Vere', 'Oxford', 'Earl of Oxford', 'Edward de Vere', 'Vere'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1550,
      death_year: 1604,
      roles: ['Earl of Oxford', 'Nobleman', 'Patron of the arts'],
      key_events: [
        'Ward of William Cecil',
        'Alleged royal scandal 1574',
        'Italian travels 1575-76',
      ],
      relationships: [
        { entity: 'hoohoo', type: 'alleged-scandal', confidence: 0.80 },
        { entity: 'William Cecil', type: 'ward-guardian', confidence: 1.0 },
      ],
    },
    importance_weight: 0.75,
    theme_associations: ['royal_scandal', 'incest', 'authorship', 'nobility', 'bastard'],
    historical_notes: 'Central to Oxfordian authorship theory. Alleged father of Elizabeth\'s child.',
  },

  // ==================== JUVENILIA ENTITIES (Pre-1593) ====================
  {
    id: 6,
    name: 'Roger Manwood',
    name_variants: ['Roger', 'Manwood', 'Sir Roger Manwood', 'Roger Manwood'],
    entity_type: 'person',
    time_period: 'pre_1592',
    biographical_data: {
      birth_year: 1525,
      death_year: 1592,
      roles: ['Judge', 'Baron of the Exchequer', 'Chief Baron'],
      key_events: [
        'Chief Baron of Exchequer 1578',
        'Investigated for corruption',
        'Died 1592',
        'Marlowe wrote Latin epitaph for him',
      ],
      relationships: [
        { entity: 'Whitgift', type: 'victim-persecutor', confidence: 0.85 },
        { entity: 'Christopher Marlowe', type: 'patron-poet', confidence: 0.90 },
      ],
    },
    importance_weight: 0.85,
    theme_associations: ['persecution', 'torture', 'death', 'patron', 'corruption'],
    historical_notes: 'Marlowe wrote epitaph. Possible early patron. Cipher patterns suggest persecution.',
  },

  {
    id: 7,
    name: 'Cate Benchkin',
    name_variants: ['Cate', 'Benchkin', 'Cate Benchkin', 'Katherine Benchkin'],
    entity_type: 'person',
    time_period: 'pre_1593',
    biographical_data: {
      birth_year: null,
      death_year: null,
      roles: ['Alleged early patron', 'Possible family connection'],
      key_events: [],
      relationships: [],
    },
    importance_weight: 0.65,
    theme_associations: ['juvenilia', 'early_work', 'patron', 'family'],
    historical_notes: 'Appears in early cipher patterns. Roberta\'s research suggests early patron.',
  },

  {
    id: 8,
    name: 'Ovid',
    name_variants: ['Ovid', 'Ovidius', 'Publius Ovidius Naso'],
    entity_type: 'person',
    time_period: 'classical',
    biographical_data: {
      birth_year: -43,
      death_year: 17,
      roles: ['Roman poet'],
      key_events: [
        'Wrote Metamorphoses',
        'Wrote Amores (Elegies)',
        'Exiled by Augustus',
      ],
      relationships: [],
    },
    importance_weight: 0.70,
    theme_associations: ['classical', 'translation', 'latin', 'poetry', 'juvenilia'],
    historical_notes: 'Marlowe translated Ovid\'s Elegies. Classical reference in early work.',
  },

  // ==================== SECONDARY ENTITIES ====================
  {
    id: 9,
    name: 'Francis Bacon',
    name_variants: ['Bacon', 'Francis Bacon', 'Robert', 'Robert Bacon'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1561,
      death_year: 1626,
      roles: ['Philosopher', 'Statesman', 'Cipher expert', 'Lord Chancellor'],
      key_events: [
        'Developed Baconian cipher',
        'Lord Chancellor 1618',
        'Fell from power 1621',
      ],
      relationships: [
        { entity: 'hoohoo', type: 'subject-monarch', confidence: 0.80 },
      ],
    },
    importance_weight: 0.70,
    theme_associations: ['cipher', 'encoding', 'authorship', 'sonnets', 'cryptography'],
    historical_notes: 'Cipher expert. Alternative authorship theory. "Robert" nickname in patterns.',
  },

  {
    id: 10,
    name: 'Robert Dudley',
    name_variants: ['Leicester', 'Dudley', 'Robert Dudley', 'Earl of Leicester'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1532,
      death_year: 1588,
      roles: ['Earl of Leicester', 'Favorite of Elizabeth I'],
      key_events: [
        'Created Earl of Leicester 1564',
        'Alleged relationship with Elizabeth',
        'Married Lettice Knollys 1578',
      ],
      relationships: [
        { entity: 'hoohoo', type: 'rumored-lover', confidence: 0.85 },
      ],
    },
    importance_weight: 0.65,
    theme_associations: ['royal_scandal', 'paternity', 'secret', 'bastard', 'succession'],
    historical_notes: 'Alleged father of Elizabeth\'s child. Alternative to Oxford theory.',
  },

  {
    id: 11,
    name: 'Giovanni Cicogna',
    name_variants: ['Giovanni', 'Cicogna', 'Giovanni Cicogna', 'Duke Cicogna'],
    entity_type: 'person',
    time_period: 'post_1593',
    biographical_data: {
      birth_year: null,
      death_year: null,
      roles: ['Venetian nobleman', 'Duke'],
      key_events: [
        'Married Marina 1593',
      ],
      relationships: [
        { entity: 'Marina Cicogna', type: 'husband', confidence: 1.0 },
      ],
    },
    importance_weight: 0.60,
    theme_associations: ['venice', 'nobility', 'merchant', 'marriage'],
    historical_notes: 'Husband of Marina. Part of Venice refuge theory.',
  },

  {
    id: 12,
    name: 'Thomas Watson',
    name_variants: ['Watson', 'Thomas Watson', 'Tom Watson'],
    entity_type: 'person',
    time_period: 'pre_1592',
    biographical_data: {
      birth_year: 1555,
      death_year: 1592,
      roles: ['Poet', 'Translator', 'Friend of Marlowe'],
      key_events: [
        'Killed William Bradley with Marlowe 1589',
        'Died 1592',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'friend', confidence: 0.95 },
      ],
    },
    importance_weight: 0.65,
    theme_associations: ['friendship', 'death', 'patron', 'poetry', 'violence'],
    historical_notes: 'Close friend of Marlowe. Involved in Bradley incident.',
  },

  {
    id: 13,
    name: 'Francis Walsingham',
    name_variants: ['Walsingham', 'Francis Walsingham', 'Sir Francis Walsingham'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1532,
      death_year: 1590,
      roles: ['Spymaster', 'Secretary of State', 'Intelligence chief'],
      key_events: [
        'Principal Secretary 1573',
        'Ran spy network',
        'Uncovered Babington Plot',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'employer-spy', confidence: 0.80 },
      ],
    },
    importance_weight: 0.70,
    theme_associations: ['espionage', 'intelligence', 'secret', 'spy', 'conspiracy'],
    historical_notes: 'Spymaster. Possibly employed Marlowe as intelligence agent.',
  },

  {
    id: 14,
    name: 'Thomas Kyd',
    name_variants: ['Kyd', 'Thomas Kyd', 'Thomas Kid'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1558,
      death_year: 1594,
      roles: ['Playwright', 'Scrivener'],
      key_events: [
        'Wrote Spanish Tragedy',
        'Arrested and tortured 1593',
        'Implicated Marlowe',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'roommate', confidence: 0.95 },
        { entity: 'Whitgift', type: 'victim-persecutor', confidence: 0.85 },
      ],
    },
    importance_weight: 0.60,
    theme_associations: ['playwright', 'torture', 'atheism', 'persecution', 'betrayal'],
    historical_notes: 'Tortured, betrayed Marlowe. Author of Spanish Tragedy.',
  },

  {
    id: 15,
    name: 'Henry Wriothesley',
    name_variants: ['Wriothesley', 'Southampton', 'Henry Wriothesley', 'Earl of Southampton'],
    entity_type: 'person',
    time_period: 'post_1593',
    biographical_data: {
      birth_year: 1573,
      death_year: 1624,
      roles: ['Earl of Southampton', 'Patron', 'Nobleman'],
      key_events: [
        'Dedicated patron of Shakespeare',
        'Venus & Adonis dedicated to him 1593',
        'Imprisoned for Essex Rebellion',
      ],
      relationships: [
        { entity: 'William Shakespeare', type: 'patron-poet', confidence: 0.95 },
      ],
    },
    importance_weight: 0.55,
    theme_associations: ['patron', 'nobility', 'authorship', 'sonnets'],
    historical_notes: 'Shakespeare patron. Possible connection to authorship questions.',
  },

  // ==================== ABSTRACT/THEMATIC ENTITIES ====================
  {
    id: 16,
    name: 'Star Chamber',
    name_variants: ['Star Chamber', 'Starre Chamber', 'Chamber'],
    entity_type: 'institution',
    time_period: 'all',
    biographical_data: {
      roles: ['Court of law', 'Torture chamber'],
    },
    importance_weight: 0.70,
    theme_associations: ['persecution', 'torture', 'imprisonment', 'trial'],
    historical_notes: 'Court used by Whitgift for religious persecution.',
  },

  {
    id: 17,
    name: 'Venice',
    name_variants: ['Venice', 'Venetian', 'Venice republic'],
    entity_type: 'location',
    time_period: 'post_1593',
    biographical_data: {
      roles: ['City-state', 'Refuge'],
    },
    importance_weight: 0.65,
    theme_associations: ['venice', 'refuge', 'exile', 'safety', 'merchant'],
    historical_notes: 'Roberta\'s theory: Marlowe fled to Venice after fake death.',
  },

  {
    id: 18,
    name: 'Atheism',
    name_variants: ['atheism', 'atheist', 'blasphemy'],
    entity_type: 'concept',
    time_period: 'all',
    biographical_data: {
      roles: ['Heresy', 'Crime'],
    },
    importance_weight: 0.60,
    theme_associations: ['persecution', 'heresy', 'religious_persecution', 'death'],
    historical_notes: 'Charge against Marlowe. Punishable by death.',
  },

  // ==================== MINOR ENTITIES ====================
  {
    id: 19,
    name: 'William Cecil',
    name_variants: ['Cecil', 'William Cecil', 'Burghley', 'Lord Burghley'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1520,
      death_year: 1598,
      roles: ['Lord High Treasurer', 'Chief advisor'],
      relationships: [
        { entity: 'Edward de Vere', type: 'guardian-ward', confidence: 1.0 },
        { entity: 'hoohoo', type: 'advisor-monarch', confidence: 0.95 },
      ],
    },
    importance_weight: 0.55,
    theme_associations: ['nobility', 'advisor', 'power', 'guardian'],
    historical_notes: 'Guardian of Oxford. Chief minister to Elizabeth.',
  },

  {
    id: 20,
    name: 'Richard Baines',
    name_variants: ['Baines', 'Richard Baines'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: null,
      death_year: null,
      roles: ['Informer', 'Spy'],
      key_events: [
        'Wrote "Baines Note" accusing Marlowe of atheism',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'informer-accused', confidence: 0.95 },
      ],
    },
    importance_weight: 0.50,
    theme_associations: ['betrayal', 'atheism', 'persecution', 'informer'],
    historical_notes: 'Accused Marlowe of atheism. Possibly agent provocateur.',
  },

  {
    id: 21,
    name: 'Robert Poley',
    name_variants: ['Poley', 'Robert Poley', 'Pooley'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1556,
      death_year: 1602,
      roles: ['Spy', 'Courier', 'Government agent'],
      key_events: [
        'Present at Marlowe\'s "death" 1593',
        'Government messenger',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'witness-deceased', confidence: 0.90 },
      ],
    },
    importance_weight: 0.55,
    theme_associations: ['death', 'conspiracy', 'spy', 'deptford', 'murder'],
    historical_notes: 'Present at Deptford. Suspicious role in Marlowe\'s "death".',
  },

  {
    id: 22,
    name: 'Ingram Frizer',
    name_variants: ['Frizer', 'Ingram Frizer', 'Fraizer'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: null,
      death_year: 1627,
      roles: ['Con man', 'Business agent'],
      key_events: [
        'Allegedly killed Marlowe 1593',
        'Pardoned immediately',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'killer-victim', confidence: 0.90 },
      ],
    },
    importance_weight: 0.50,
    theme_associations: ['death', 'murder', 'deptford', 'conspiracy', 'pardon'],
    historical_notes: 'Allegedly stabbed Marlowe. Suspiciously pardoned.',
  },

  {
    id: 23,
    name: 'Thomas Walsingham',
    name_variants: ['Thomas Walsingham', 'Walsingham', 'Sir Thomas Walsingham'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1561,
      death_year: 1630,
      roles: ['Patron', 'Cousin of Francis Walsingham'],
      key_events: [
        'Patron of Marlowe',
        'Marlowe staying with him before death',
      ],
      relationships: [
        { entity: 'Christopher Marlowe', type: 'patron-poet', confidence: 0.90 },
        { entity: 'Francis Walsingham', type: 'cousin', confidence: 1.0 },
      ],
    },
    importance_weight: 0.60,
    theme_associations: ['patron', 'protection', 'conspiracy', 'refuge'],
    historical_notes: 'Marlowe\'s patron. Possible involvement in fake death.',
  },

  {
    id: 24,
    name: 'Christopher Marlowe',
    name_variants: ['Marlowe', 'Christopher Marlowe', 'Kit Marlowe', 'Marlow', 'Marley', 'Marlin'],
    entity_type: 'person',
    time_period: 'all',
    biographical_data: {
      birth_year: 1564,
      death_year: 1593,
      roles: ['Playwright', 'Poet', 'Spy'],
      key_events: [
        'Born Canterbury 1564',
        'Cambridge University',
        'First performed plays 1587',
        '"Died" Deptford 1593',
      ],
      relationships: [],
    },
    importance_weight: 1.0,
    theme_associations: ['authorship', 'death', 'spy', 'conspiracy', 'venice', 'exile'],
    historical_notes: 'Subject of the cipher research. Central to all patterns.',
  },

  {
    id: 25,
    name: 'William Shakespeare',
    name_variants: ['Shakespeare', 'William Shakespeare', 'Shake-speare', 'Shakspere'],
    entity_type: 'person',
    time_period: 'post_1593',
    biographical_data: {
      birth_year: 1564,
      death_year: 1616,
      roles: ['Playwright', 'Actor', 'Poet'],
      key_events: [
        'First published work 1593',
        'First plays 1590s',
        'Globe Theatre 1599',
      ],
      relationships: [
        { entity: 'Henry Wriothesley', type: 'poet-patron', confidence: 0.95 },
      ],
    },
    importance_weight: 0.70,
    theme_associations: ['authorship', 'theater', 'sonnets', 'plays'],
    historical_notes: 'Traditional attribution. Authorship questions central to cipher research.',
  },
];

/**
 * Helper function to get entities by time period
 */
export function getEntitiesByPeriod(period) {
  if (period === 'all') return MOCK_ENTITIES;
  return MOCK_ENTITIES.filter(e => e.time_period === period || e.time_period === 'all');
}

/**
 * Helper function to get entities by theme
 */
export function getEntitiesByTheme(theme) {
  return MOCK_ENTITIES.filter(e => e.theme_associations.includes(theme));
}

/**
 * Helper function to search entities
 */
export function searchEntities(query) {
  const lowerQuery = query.toLowerCase();
  return MOCK_ENTITIES.filter(entity =>
    entity.name.toLowerCase().includes(lowerQuery) ||
    entity.name_variants.some(v => v.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Helper function to get related entities
 */
export function getRelatedEntities(entityId) {
  const entity = MOCK_ENTITIES.find(e => e.id === entityId);
  if (!entity || !entity.biographical_data.relationships) return [];
  
  const relatedNames = entity.biographical_data.relationships.map(r => r.entity);
  return MOCK_ENTITIES.filter(e => relatedNames.includes(e.name));
}

/**
 * Category definitions for organizing sources
 */
export const CATEGORIES = {
  marlowe_plays: {
    id: 'marlowe_plays',
    name: 'Marlowe - Plays',
    description: 'Dramatic works attributed to Christopher Marlowe',
    icon: '🎭',
  },
  marlowe_poetry: {
    id: 'marlowe_poetry',
    name: 'Marlowe - Poetry',
    description: 'Poetic works by Marlowe including translations',
    icon: '📜',
  },
  spanish_tragedy: {
    id: 'spanish_tragedy',
    name: 'Spanish Tragedy',
    description: 'The Spanish Tragedy and related texts',
    icon: '⚔️',
  },
  shakespeare_tragedies: {
    id: 'shakespeare_tragedies',
    name: 'Shakespeare - Tragedies',
    description: 'Tragic plays attributed to Shakespeare',
    icon: '💀',
  },
  shakespeare_histories: {
    id: 'shakespeare_histories',
    name: 'Shakespeare - Histories',
    description: 'History plays attributed to Shakespeare',
    icon: '👑',
  },
  shakespeare_poetry: {
    id: 'shakespeare_poetry',
    name: 'Shakespeare - Poetry',
    description: 'Narrative poems and sonnets',
    icon: '🌹',
  },
  bible: {
    id: 'bible',
    name: 'King James Bible',
    description: '1611 translation of the Bible',
    icon: '✝️',
  },
  poetry: {
    id: 'poetry',
    name: 'Other Poetry',
    description: 'Elizabethan poetry by various authors',
    icon: '🎨',
  },
  prose: {
    id: 'prose',
    name: 'Prose Works',
    description: 'Elizabethan prose fiction and non-fiction',
    icon: '📖',
  },
  user_uploads: {
    id: 'user_uploads',
    name: 'My Uploads',
    description: 'Custom texts uploaded by user',
    icon: '📁',
  },
};