import { useState, useEffect, useRef } from "react";

/* ═══════════ PALETTE ═══════════ */
const P = {
  parch: "#F5F0E4", parchDark: "#EDE5D0", ink: "#1C1608", inkSoft: "#3A2E18",
  inkMuted: "#6B5B3A", inkFaint: "#A8956A", gold: "#8B7040", goldLight: "#C4A862",
  border: "#D8CDB4", borderLight: "#E5DCC8",
  bg: "#FAF9F5", white: "#FFF",
  navBg: "#1C1608", navText: "#C4B896",
  green: "#2D7A3A", orange: "#D85A30", red: "#993030"
};

/* ═══════════ CULTURAL BORDER PATTERNS (SVG path generators) ═══════════ */
const PATTERNS = {
  yo: (w) => { // Yorùbá — adire wave
    let d1="", d2="", d3="";
    for(let x=0;x<w;x+=20){d1+=`${x===0?"M":"Q"}${x+10} 0, ${x+20} 7 `;d2+=`${x===0?"M":"Q"}${x+10} 14, ${x+20} 7 `;d3+=`${x===0?"M":"Q"}${x+10} 0, ${x+20} 7 `;}
    return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
      <path d="M0 3 ${Array.from({length:Math.floor(w/16)},(_,i)=>`Q${i*16+8} ${i%2?10:-4}, ${(i+1)*16} 3`).join(" ")}"/>
      <path d="M0 10 ${Array.from({length:Math.floor(w/16)},(_,i)=>`Q${i*16+8} ${i%2?17:3}, ${(i+1)*16} 10`).join(" ")}"/>
    </g>`;
  },
  ig: (w) => { // Igbo — uli angular lines
    const segs = Math.floor(w / 12);
    return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
      <path d="M0 2 ${Array.from({length:segs},(_,i)=>`L${i*12+6} ${i%2?12:2} L${(i+1)*12} 2`).join(" ")}"/>
      <path d="M0 7 ${Array.from({length:segs},(_,i)=>`L${i*12+6} ${i%2?2:12} L${(i+1)*12} 7`).join(" ")}"/>
    </g>`;
  },
  ha: (w) => { // Hausa — arewa interlocking diamonds
    return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
      ${Array.from({length:Math.floor(w/20)},(_,i)=>`<path d="M${i*20+10} 0 L${i*20+20} 7 L${i*20+10} 14 L${i*20} 7 Z"/>`).join("")}
    </g>`;
  },
  zu: (w) => { // Zulu — Ndebele stepped geometry
    return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.25" fill="none">
      ${Array.from({length:Math.floor(w/16)},(_,i)=>`<rect x="${i*16}" y="1" width="14" height="5" rx="0"/><rect x="${i*16+3}" y="8" width="8" height="4" rx="0"/>`).join("")}
    </g>`;
  },
  en: (w) => { // English/default — simple zigzag
    return `<g stroke="${P.inkSoft}" stroke-width="0.4" opacity="0.2" fill="none">
      <path d="M0 7 ${Array.from({length:Math.floor(w/8)},(_,i)=>`L${i*8+4} ${i%2?1:13} L${(i+1)*8} 7`).join(" ")}"/>
    </g>`;
  },
  pcm: (w) => P.PATTERNS?.en?.(w) || PATTERNS.en(w),
  default: (w) => PATTERNS.en(w)
};
PATTERNS.pcm = PATTERNS.en;
const getPattern = (code, w) => (PATTERNS[code] || PATTERNS.default)(w);

/* ═══════════ DATA ═══════════ */
const FILMS=[
  {id:"behind-the-scenes",title:"Behind the Scenes",year:2025,runtime:"135 min",rated:"15+",tagline:"Not everything glitters.",synopsis:"Funke Akindele directs and stars in this peek behind the curtain of the typical African 'rich aunty' persona. The film explores the lengths people go to maintain appearances, blending comedy with sharp social commentary. It became the highest-grossing Nigerian film of all time, crossing ₦2.7 billion at the box office and cementing Akindele's reign as the undisputed queen of Nigerian cinema.",poster:"https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop",backdrop:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=500&fit=crop",genres:["Comedy","Drama"],country:"Nigeria",lang:[{code:"yo",name:"Yorùbá",pct:55},{code:"en",name:"English",pct:35},{code:"pcm",name:"Pidgin",pct:10}],scores:{critic:78,audience:96,verified:94,heat:99},cc:45,ac:38200,vc:15600,watch:[{p:"Prime Video",url:"#",r:"Global"}],cast:[{n:"Funke Akindele",r:"Lead"},{n:"Falz",r:"Supporting"},{n:"Nancy Isime",r:"Supporting"}],crew:[{n:"Funke Akindele",r:"Director",id:"funke-akindele"},{n:"Funke Akindele",r:"Producer",id:"funke-akindele"}],related:["everybody-loves-jenifa","onobiren","gingerrr"],box:{wk:186e6,cum:2724e6,w:13,live:true},awards:["Highest-Grossing Nigerian Film Ever"]},
  {id:"everybody-loves-jenifa",title:"Everybody Loves Jenifa",year:2024,runtime:"128 min",rated:"12+",tagline:"Jenifa is back.",synopsis:"Jenifa navigates new challenges when a troublesome neighbour threatens her charity organization. The sixth instalment of the beloved franchise broke box office records, grossing ₦45.2 million on opening day alone and surpassing ₦1.88 billion total — making it the second highest-grossing Nigerian film ever.",poster:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",backdrop:"https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=500&fit=crop",genres:["Comedy","Drama"],country:"Nigeria",lang:[{code:"yo",name:"Yorùbá",pct:60},{code:"en",name:"English",pct:30},{code:"pcm",name:"Pidgin",pct:10}],scores:{critic:68,audience:94,verified:91,heat:97},cc:32,ac:42000,vc:18400,watch:[{p:"Netflix",url:"#",r:"Global"},{p:"YouTube",url:"#",r:"Nigeria"}],cast:[{n:"Funke Akindele",r:"Jenifa"},{n:"Falz",r:"Supporting"},{n:"Jackie Appiah",r:"Guest"}],crew:[{n:"Funke Akindele",r:"Director",id:"funke-akindele"}],related:["behind-the-scenes","gingerrr"],box:{wk:45e6,cum:1880e6,w:12,live:false},awards:["First Nigerian film to open at ₦45M"]},
  {id:"onobiren",title:"Onobiren: A Woman's Story",year:2026,runtime:"118 min",rated:"15+",tagline:"Her story. Her terms.",synopsis:"Laju Iren's directorial debut follows a woman navigating identity, resilience, and female solidarity in contemporary Lagos. Released to coincide with Women's Month, the film topped the Nigerian box office on its opening weekend with $22,000, beating both local and international releases.",poster:"https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",backdrop:"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=500&fit=crop",genres:["Drama"],country:"Nigeria",lang:[{code:"en",name:"English",pct:65},{code:"yo",name:"Yorùbá",pct:25},{code:"pcm",name:"Pidgin",pct:10}],scores:{critic:84,audience:88,verified:85,heat:92},cc:18,ac:4200,vc:1800,watch:[{p:"Cinema",url:"#",r:"Nigeria"}],cast:[{n:"Laju Iren",r:"Lead"}],crew:[{n:"Laju Iren",r:"Director",id:"laju-iren"}],related:["behind-the-scenes"],box:{wk:34e6,cum:34e6,w:1,live:true},awards:[]},
  {id:"gingerrr",title:"Gingerrr",year:2025,runtime:"112 min",rated:"15+",tagline:"Friendship. Chaos. Gold.",synopsis:"Four childhood friends embark on a chaotic, action-packed mission to steal a charmed box of gold. Directed by Yemi Morafa, Gingerrr became the highest-grossing September release in Nigerian cinema history with a debut weekend of ₦82 million and a total gross of ₦378 million.",poster:"https://images.unsplash.com/photo-1518676590747-1e3dcf5a0f60?w=400&h=600&fit=crop",backdrop:"https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=500&fit=crop",genres:["Action","Comedy"],country:"Nigeria",lang:[{code:"en",name:"English",pct:50},{code:"yo",name:"Yorùbá",pct:30},{code:"pcm",name:"Pidgin",pct:20}],scores:{critic:71,audience:86,verified:83,heat:88},cc:22,ac:16800,vc:5200,watch:[{p:"Netflix",url:"#",r:"Global"},{p:"Showmax",url:"#",r:"Africa"}],cast:[{n:"Bukunmi 'Kiekie' Adeaga-Ilori",r:"Lala"},{n:"Bisola Aiyeola",r:"Sylvia"},{n:"Wumi Toriola",r:"Bugari"}],crew:[{n:"Yemi Morafa",r:"Director",id:"yemi-morafa"}],related:["behind-the-scenes","everybody-loves-jenifa"],box:{wk:12e6,cum:378e6,w:24,live:false},awards:["Highest-Grossing September Release"]},
  {id:"king-of-boys",title:"King of Boys",year:2018,runtime:"169 min",rated:"18+",tagline:"Power is everything.",synopsis:"Alhaja Eniola Salami, businesswoman and philanthropist, watches her rise to power threatened by her past. Kemi Adetiba's landmark film redefined Nigerian cinema and became a cultural touchstone. Grossed ₦245 million theatrically and became one of the most-streamed Nigerian films on Netflix globally.",poster:"https://images.unsplash.com/photo-1460881680858-30d872d5b430?w=400&h=600&fit=crop",backdrop:"https://images.unsplash.com/photo-1460881680858-30d872d5b430?w=1200&h=500&fit=crop",genres:["Crime","Drama","Thriller"],country:"Nigeria",lang:[{code:"yo",name:"Yorùbá",pct:70},{code:"en",name:"English",pct:20},{code:"ha",name:"Hausa",pct:10}],scores:{critic:91,audience:93,verified:92,heat:85},cc:51,ac:24100,vc:7800,watch:[{p:"Netflix",url:"#",r:"Global"},{p:"YouTube",url:"#",r:"Global"}],cast:[{n:"Sola Sobowale",r:"Eniola Salami"},{n:"Reminisce",r:"Makanaki"},{n:"Illbliss",r:"Odogwu"}],crew:[{n:"Kemi Adetiba",r:"Director",id:"kemi-adetiba"},{n:"Kemi Adetiba",r:"Writer",id:"kemi-adetiba"}],related:["behind-the-scenes","everybody-loves-jenifa"],box:{wk:0,cum:245e6,w:0,live:false},awards:["AMVCA Best Director","Africa Magic Viewers' Choice"]}
];

const DIRS={"jade-osiberu":{name:"Jade Osiberu",bio:"Founder of Greoh Studios. Known for gritty, authentic Lagos stories blending Yorùbá street culture with cinematic ambition.",roles:["Director","Producer","Writer"],awards:["AMVCA Best Film","TIFF 2023"],films:["gangs-of-lagos","brotherhood"],type:"above"},"kunle-afolayan":{name:"Kunle Afolayan",bio:"Son of legendary artist Ade Love. Known for high production values and multilingual storytelling across West Africa.",roles:["Director","Producer"],awards:["Golden Stallion Nom.","AMAA"],films:["citation"],type:"above"},"kemi-adetiba":{name:"Kemi Adetiba",bio:"Music video director turned feature filmmaker. Created a cultural phenomenon with King of Boys, redefining Nigerian cinema.",roles:["Director","Writer"],awards:["AMVCA Best Director"],films:["king-of-boys"],type:"above"},"funke-akindele":{name:"Funke Akindele",bio:"Actress turned director-producer who shattered box office records. The most commercially successful filmmaker in West Africa. Behind the Scenes (₦2.7B), Everybody Loves Jenifa (₦1.88B), and A Tribe Called Judah (₦1.4B) make her the only filmmaker with three billion-naira films.",roles:["Director","Actor","Producer"],awards:["Highest-Grossing Film x3"],films:["behind-the-scenes","everybody-loves-jenifa"],type:"above"},
  "laju-iren":{name:"Laju Iren",bio:"Writer and filmmaker whose directorial debut Onobiren topped the Nigerian box office on opening weekend in March 2026. Founder of the Christian Story Teller Prize.",roles:["Director","Writer","Producer"],awards:["#1 Opening Weekend Mar 2026"],films:["onobiren"],type:"above"},
  "yemi-morafa":{name:"Yemi Morafa",bio:"Director of Gingerrr, the highest-grossing September release in Nigerian cinema history. Known for action-comedy that balances spectacle with character.",roles:["Director"],awards:["Highest-Grossing September Release"],films:["gingerrr"],type:"above"},
  "yinka-edward":{name:"Yinka Edward",bio:"Lagos-based cinematographer whose work on Gangs of Lagos and Brotherhood established a new visual standard for Nigerian crime cinema. Known for handheld intimacy and controlled chaos.",roles:["Cinematographer"],awards:["AMVCA Best Cinematography Nom."],films:["gangs-of-lagos","brotherhood"],type:"craft"},
  "ayo-shonaiya":{name:"Ayo Shonaiya",bio:"Veteran music and entertainment executive turned film producer. Bridges the gap between music culture and cinema production in West Africa.",roles:["Producer"],awards:[],films:["king-of-boys"],type:"above"},
  "tunde-babalola":{name:"Tunde Babalola",bio:"Sound designer and re-recording mixer. One of the most sought-after post-production specialists in Lagos, known for immersive Yorùbá-language sound design.",roles:["Sound Designer","Re-recording Mixer"],awards:["AMVCA Best Sound"],films:["king-of-boys","gangs-of-lagos"],type:"craft"},
  "paul-gambit":{name:"Paul Gambit",bio:"Colourist and post-production supervisor based in Lagos. Has graded some of the most commercially successful Nigerian films. Works across Resolve and Baselight.",roles:["Colourist"],awards:[],films:["brotherhood","gangs-of-lagos","tribe-judah"],type:"craft"},
  "bimbo-akintola-cd":{name:"Bimbo Akintola",bio:"Costume designer who has dressed some of the most iconic characters in Nollywood. Her work on King of Boys created a visual language for Eniola Salami that became inseparable from the character.",roles:["Costume Designer"],awards:["AMVCA Best Costume"],films:["king-of-boys"],type:"craft"},
  "tola-akerele":{name:"Tola Akerele",bio:"Editor with a sharp sense of rhythm. Known for precise cutting that serves performance without sacrificing pace. One of the few female editors working consistently at the top tier of Nigerian cinema.",roles:["Editor"],awards:[],films:["citation","king-of-boys"],type:"craft"},
  "osagie-ize":{name:"Osagie Ize-Iyamu",bio:"VFX supervisor handling compositing and visual effects for Nigerian productions. Previously worked with international post houses before returning to Lagos to build local capacity.",roles:["VFX Supervisor"],awards:[],films:["brotherhood","tribe-judah"],type:"craft"}
};

const FULL_CREW={
  "behind-the-scenes":{above:[{n:"Funke Akindele",r:"Director",id:"funke-akindele"},{n:"Funke Akindele",r:"Producer",id:"funke-akindele"}],craft:[{n:"Paul Gambit",r:"Colour",id:"paul-gambit"},{n:"Tunde Babalola",r:"Sound Design",id:"tunde-babalola"}]},
  "everybody-loves-jenifa":{above:[{n:"Funke Akindele",r:"Director",id:"funke-akindele"}],craft:[{n:"Paul Gambit",r:"Colour",id:"paul-gambit"}]},
  "onobiren":{above:[{n:"Laju Iren",r:"Director",id:"laju-iren"}],craft:[]},
  "gingerrr":{above:[{n:"Yemi Morafa",r:"Director",id:"yemi-morafa"}],craft:[{n:"Yinka Edward",r:"Cinematography",id:"yinka-edward"}]},
  "king-of-boys":{above:[{n:"Kemi Adetiba",r:"Director",id:"kemi-adetiba"},{n:"Kemi Adetiba",r:"Writer",id:"kemi-adetiba"}],craft:[{n:"Tunde Babalola",r:"Sound Design",id:"tunde-babalola"},{n:"Bimbo Akintola",r:"Costume Design",id:"bimbo-akintola-cd"},{n:"Tola Akerele",r:"Editor",id:"tola-akerele"}]}
};

const LANGS=[{code:"yo",name:"Yorùbá",native:"Èdè Yorùbá",count:847,region:"Southwest Nigeria"},{code:"ig",name:"Igbo",native:"Asụsụ Igbo",count:623,region:"Southeast Nigeria"},{code:"ha",name:"Hausa",native:"Harshen Hausa",count:1240,region:"Northern Nigeria"},{code:"pcm",name:"Naijá Pidgin",native:"Naijá",count:412,region:"Nigeria"},{code:"zu",name:"Zulu",native:"isiZulu",count:289,region:"South Africa"},{code:"xh",name:"Xhosa",native:"isiXhosa",count:156,region:"South Africa"},{code:"tw",name:"Twi",native:"Twi",count:310,region:"Ghana"},{code:"sw",name:"Swahili",native:"Kiswahili",count:198,region:"East Africa"},{code:"am",name:"Amharic",native:"አማርኛ",count:230,region:"Ethiopia"},{code:"en",name:"English",native:"English",count:2100,region:"Pan-African"},{code:"fr",name:"French",native:"Français",count:560,region:"Francophone Africa"}];

/* ═══════════ AVAILABILITY DATA (per-film, per-country) ═══════════ */
const AVAIL={
  "behind-the-scenes":{NG:[{p:"Cinema",t:"ticket"},{p:"Prime Video",t:"sub"}],GH:[{p:"Cinema",t:"ticket"}],ZA:[],KE:[],US:[{p:"Prime Video",t:"sub"}],GB:[{p:"Prime Video",t:"sub"}],CM:[],SN:[]},
  "everybody-loves-jenifa":{NG:[{p:"Netflix",t:"sub"},{p:"YouTube",t:"free"}],GH:[{p:"Netflix",t:"sub"}],ZA:[{p:"Netflix",t:"sub"}],KE:[{p:"Netflix",t:"sub"}],US:[{p:"Netflix",t:"sub"}],GB:[{p:"Netflix",t:"sub"}],CM:[],SN:[]},
  "onobiren":{NG:[{p:"Cinema",t:"ticket"}],GH:[],ZA:[],KE:[],US:[],GB:[],CM:[],SN:[]},
  "gingerrr":{NG:[{p:"Netflix",t:"sub"},{p:"Showmax",t:"sub"}],GH:[{p:"Showmax",t:"sub"}],ZA:[{p:"Showmax",t:"sub"}],KE:[],US:[{p:"Netflix",t:"sub"}],GB:[{p:"Netflix",t:"sub"}],CM:[],SN:[]},
  "king-of-boys":{NG:[{p:"Netflix",t:"sub"},{p:"YouTube",t:"free"}],GH:[{p:"Netflix",t:"sub"}],ZA:[{p:"Netflix",t:"sub"},{p:"Showmax",t:"sub"}],KE:[{p:"Netflix",t:"sub"}],US:[{p:"Netflix",t:"sub"}],GB:[{p:"Netflix",t:"sub"}],CM:[],SN:[]}
};
const COUNTRIES=[{c:"NG",n:"Nigeria",f:"🇳🇬"},{c:"GH",n:"Ghana",f:"🇬🇭"},{c:"ZA",n:"South Africa",f:"🇿🇦"},{c:"KE",n:"Kenya",f:"🇰🇪"},{c:"US",n:"United States",f:"🇺🇸"},{c:"GB",n:"United Kingdom",f:"🇬🇧"},{c:"CM",n:"Cameroon",f:"🇨🇲"},{c:"SN",n:"Senegal",f:"🇸🇳"}];

const fmt=n=>{if(n>=1e9)return`₦${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`₦${(n/1e6).toFixed(1)}M`;return`₦${(n/1e3).toFixed(0)}K`;};

/* ═══════════ EVENTS DATA ═══════════ */
const EVENTS=[
  {id:"davido-timeless",title:"Davido: Timeless Tour Lagos",type:"CONCERT",venue:"Eko Convention Centre",city:"Lagos",date:"Mar 22, 2026",img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=300&fit=crop",live:true,barcode:true,scores:{audience:96,verified:91},tickets:"Sold out",capacity:"12,000"},
  {id:"muson-fest-2026",title:"Lagos Theatre Festival",type:"THEATRE",venue:"Muson Centre",city:"Lagos",date:"Mar 28 – Apr 6, 2026",img:"https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=300&fit=crop",live:false,barcode:true,scores:{audience:88,verified:82},tickets:"On sale",capacity:"800/night"},
  {id:"ake-book-fest",title:"Ake Arts & Book Festival",type:"BOOK FAIR",venue:"Various venues",city:"Abeokuta",date:"Apr 10–13, 2026",img:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=300&fit=crop",live:false,barcode:false,scores:null,tickets:"Free entry",capacity:"5,000+"},
  {id:"fela-shrine",title:"Felabration 2026",type:"MUSIC FESTIVAL",venue:"New Afrika Shrine",city:"Lagos",date:"Oct 15–22, 2026",img:"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=300&fit=crop",live:false,barcode:false,scores:null,tickets:"TBA",capacity:"4,000/night"},
  {id:"joburg-comedy",title:"Johannesburg International Comedy Festival",type:"COMEDY",venue:"Theatre on the Square",city:"Johannesburg",date:"May 1–4, 2026",img:"https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=300&fit=crop",live:false,barcode:true,scores:null,tickets:"On sale",capacity:"600"},
  {id:"randle-opera",title:"Opera at Randle: Saro the Musical",type:"THEATRE",venue:"J.K. Randle Centre",city:"Lagos",date:"Apr 18–20, 2026",img:"https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=600&h=300&fit=crop",live:false,barcode:true,scores:null,tickets:"On sale",capacity:"1,200"}
];

/* ═══════════ ADMIN SUBMISSION QUEUE (mock) ═══════════ */
const ADMIN_QUEUE=[
  {id:"q1",type:"film",title:"The Black Book",submitter:"Editi Effiong",date:"Mar 12, 2026",status:"pending",hasDesign:false,excerpt:"A decommissioned secret agent goes on a quest to track down his son's killer..."},
  {id:"q2",type:"article",title:"The Rise of Yorùbá-Language Cinema: A Decade in Review",submitter:"Wilfred Okiche",date:"Mar 11, 2026",status:"pending",hasDesign:true,excerpt:"A sweeping analysis of how Yorùbá cinema reclaimed commercial dominance from 2016 to 2026...",designNote:"Rich-text with embedded images and pull quotes — original layout preserved"},
  {id:"q3",type:"event",title:"Afrobeats to the World: Wizkid Live",submitter:"Live Nation Africa",date:"Mar 10, 2026",status:"approved",hasDesign:true,excerpt:"One-night stadium show at Teslim Balogun...",designNote:"Full poster artwork and event brief submitted as designed package"},
  {id:"q4",type:"film",title:"Anikulapo: Rise of the Spectre",submitter:"Kunle Afolayan Productions",date:"Mar 9, 2026",status:"approved",hasDesign:false,excerpt:"The sequel to the Netflix hit explores deeper into Yorùbá mysticism..."},
  {id:"q5",type:"article",title:"Why South African Cinema Needs Its Own Scoring System",submitter:"Thando Mgqolozana",date:"Mar 8, 2026",status:"rejected",hasDesign:true,excerpt:"An argument for weighting Audience over Critics in the SA context...",designNote:"Submitted as designed editorial with custom typography"},
  {id:"q6",type:"crew",title:"Profile: Kagiso Lediga",submitter:"Self-submitted",date:"Mar 7, 2026",status:"pending",hasDesign:false,excerpt:"South African director-comedian seeking verified crew profile on M'Bari..."}
];

function useReveal(t=0.08){const ref=useRef(null);const[v,setV]=useState(false);useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect();}},{threshold:t});o.observe(el);return()=>o.disconnect();},[t]);return[ref,v];}

/* ═══════════ CULTURAL DIVIDER COMPONENT ═══════════ */
function CulturalDivider({langCode="en", width=320}){
  return <div style={{margin:"4px 0",height:14,overflow:"hidden"}} dangerouslySetInnerHTML={{__html:`<svg width="${width}" height="14" viewBox="0 0 ${width} 14">${getPattern(langCode,width)}</svg>`}}/>;
}

/* ═══════════ SECTION LABEL ═══════════ */
const SL=({children})=><div style={{textAlign:"center",fontSize:8,color:P.gold,letterSpacing:"0.14em",fontFamily:"var(--s)",marginBottom:4}}>{children}</div>;

/* ═══════════ SCROLL FILM PAGE ═══════════ */
function ScrollFilmPage({filmId,nav,back}){
  const f=FILMS.find(x=>x.id===filmId);
  const[showT,setShowT]=useState(false);const[us,setUs]=useState(null);
  if(!f)return<div style={{padding:60,fontFamily:"var(--s)",color:P.ink}}>Film not found.</div>;
  const primary=f.lang[0];const sw=Math.min(480,typeof window!=="undefined"?window.innerWidth-40:480);

  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0 40px",minHeight:"100vh"}}>
    <button onClick={back} style={{alignSelf:"flex-start",marginLeft:20,marginBottom:12,background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,fontFamily:"var(--b)"}}>← Back</button>

    <div style={{width:sw,maxWidth:"100%",background:P.parch,border:`1px solid ${P.inkSoft}`,padding:"12px 0",position:"relative"}}>
      {/* Inner border */}
      <div style={{position:"absolute",inset:"4px",border:`0.5px solid ${P.goldLight}`,pointerEvents:"none"}}/>

      {/* Margin lines */}
      <div style={{position:"absolute",left:14,top:8,bottom:8,width:0,borderLeft:`0.3px dashed ${P.inkSoft}`,opacity:0.12}}/>
      <div style={{position:"absolute",right:14,top:8,bottom:8,width:0,borderLeft:`0.3px dashed ${P.inkSoft}`,opacity:0.12}}/>

      <div style={{padding:"0 28px"}}>
        {/* Top cultural band */}
        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* M'Bari mark */}
        <div style={{textAlign:"center",margin:"8px 0 4px"}}>
          <div style={{fontFamily:"var(--s)",fontSize:9,color:P.gold,letterSpacing:"0.2em"}}>M ' B A R I</div>
          <div style={{fontFamily:"var(--s)",fontSize:7,color:P.inkFaint,fontStyle:"italic",marginTop:1}}>Where culture lives</div>
        </div>
        <div style={{width:120,margin:"0 auto",borderTop:`0.4px solid ${P.inkSoft}`,opacity:0.3}}/>

        {/* Title */}
        <div style={{textAlign:"center",margin:"16px 0 6px"}}>
          <h1 style={{fontFamily:"var(--s)",fontSize:28,fontWeight:700,color:P.ink,margin:0,lineHeight:1.1}}>{f.title}</h1>
          <div style={{fontFamily:"var(--s)",fontSize:12,color:P.inkMuted,marginTop:6}}>A film by <span style={{cursor:"pointer",color:P.gold,fontWeight:600}} onClick={()=>nav("director",f.crew[0].id)}>{f.crew[0].n}</span></div>
          <div style={{fontSize:11,color:P.inkFaint,marginTop:4}}>{f.country} · {f.year} · {f.runtime} · {f.genres.join(", ")}</div>
        </div>
        <div style={{width:200,margin:"8px auto",borderTop:`0.4px solid ${P.inkSoft}`,opacity:0.3}}/>
        {f.tagline&&<div style={{textAlign:"center",fontFamily:"var(--s)",fontSize:13,color:P.inkSoft,fontStyle:"italic",margin:"8px 0"}}>"{f.tagline}"</div>}

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Scores */}
        <SL>SCORES</SL>
        <div style={{display:"flex",justifyContent:"center",gap:6,margin:"6px 0 4px",flexWrap:"wrap"}}>
          {[["critic",f.scores.critic,`${f.cc} reviews`,P.green,"Critics"],["audience",f.scores.audience,`${f.ac.toLocaleString()} all`,P.green,"All audience"],["verified",f.scores.verified,`${f.vc.toLocaleString()} verified`,P.green,"Verified"],["heat",f.scores.heat,"via X · TikTok · social",P.orange,"Heat"]].map(([k,v,sub,col,label])=>(
            <div key={k} style={{border:`0.5px solid ${k==="verified"?P.green:P.inkSoft}`,padding:"8px 10px",textAlign:"center",minWidth:70,background:k==="verified"?"rgba(45,122,58,0.03)":"transparent"}}>
              <div style={{fontSize:22,fontWeight:700,color:col,fontFamily:"var(--b)"}}>{v}</div>
              <div style={{fontSize:8,color:k==="verified"?P.green:P.gold,letterSpacing:"0.06em",fontWeight:600}}>{label}</div>
              <div style={{fontSize:7,color:P.inkFaint}}>{sub}</div>
              {k==="verified"&&<div style={{marginTop:3,fontSize:7,padding:"1px 6px",background:P.green,color:"#fff",display:"inline-block",fontWeight:700,letterSpacing:"0.04em"}}>LEGAL ONLY</div>}
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:8,color:P.inkFaint,fontStyle:"italic",margin:"4px 0 6px"}}>Verified score counts only ratings from confirmed legal viewings</div>

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Synopsis */}
        <SL>THE WORK</SL>
        <p style={{fontFamily:"var(--s)",fontSize:13,color:P.inkSoft,lineHeight:1.75,margin:"4px 0 10px",textAlign:"left"}}>{f.synopsis}</p>

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Languages */}
        <SL>LANGUAGES</SL>
        <div style={{height:6,display:"flex",margin:"6px 0 8px",borderRadius:0,overflow:"hidden"}}>
          {f.lang.map((l,i)=><div key={l.code} style={{flex:l.pct,background:P.inkSoft,opacity:0.08+i*0.04}}/>)}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:4}}>
          {f.lang.map(l=><span key={l.code} onClick={()=>nav("language",l.code)} style={{cursor:"pointer",fontSize:12,fontFamily:"var(--s)"}}><span style={{fontWeight:700,color:l.pct>=50?P.ink:P.inkMuted}}>{l.name}</span><span style={{color:P.inkFaint}}> · {l.pct}%</span></span>)}
        </div>
        {primary.pct>=60&&<div style={{textAlign:"center",marginTop:4}}><span style={{fontSize:8,padding:"2px 8px",border:`0.3px solid ${P.inkSoft}`,color:P.gold,fontFamily:"var(--s)"}}>{primary.name} film</span></div>}

        <div style={{margin:"10px 0"}}><CulturalDivider langCode={primary.code} width={sw-58}/></div>

        {/* Cast */}
        <SL>THE PLAYERS</SL>
        <div style={{display:"flex",justifyContent:"center",gap:20,flexWrap:"wrap",margin:"6px 0 10px"}}>
          {f.cast.map((c,i)=><div key={i} style={{textAlign:"center"}}><div style={{fontFamily:"var(--s)",fontSize:14,fontWeight:700,color:P.ink}}>{c.n}</div><div style={{fontSize:11,color:P.inkFaint,fontStyle:"italic"}}>as {c.r}</div></div>)}
        </div>

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* STAKEHOLDERS — all visible */}
        <SL>THE MAKERS</SL>
        {(()=>{
          const fc=FULL_CREW[f.id]||{above:f.crew.map(c=>({...c})),craft:[]};
          return(<div style={{margin:"6px 0 10px"}}>
            {/* Above the line */}
            <div style={{fontSize:8,color:P.gold,letterSpacing:"0.1em",fontWeight:600,marginBottom:4}}>ABOVE THE LINE</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              {fc.above.map((c,i)=><div key={i} onClick={()=>c.id&&nav("director",c.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",border:`0.3px solid ${P.border}`,cursor:c.id?"pointer":"default",background:P.parch}}>
                <div>
                  <div style={{fontFamily:"var(--s)",fontSize:13,fontWeight:700,color:P.ink}}>{c.n}</div>
                  <div style={{fontSize:10,color:P.inkFaint}}>{c.r}</div>
                </div>
                {c.id&&<span style={{fontSize:9,color:P.gold}}>View profile →</span>}
              </div>)}
            </div>

            {/* Craft / Technical */}
            {fc.craft.length>0&&<>
              <div style={{fontSize:8,color:P.gold,letterSpacing:"0.1em",fontWeight:600,marginBottom:4}}>CRAFT AND TECHNICAL</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {fc.craft.map((c,i)=><div key={i} onClick={()=>c.id&&nav("director",c.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",border:`0.3px solid ${P.borderLight}`,cursor:c.id?"pointer":"default"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:P.ink}}>{c.n}</div>
                    <div style={{fontSize:10,color:P.inkFaint}}>{c.r}</div>
                  </div>
                  {c.id&&<span style={{fontSize:9,color:P.gold}}>Profile →</span>}
                </div>)}
              </div>
              <div style={{fontSize:8,color:P.inkFaint,fontStyle:"italic",marginTop:6}}>Every contributor visible. Every craft recognised.</div>
            </>}
          </div>);
        })()}

        {/* Awards */}
        {f.awards.length>0&&<>
          <CulturalDivider langCode={primary.code} width={sw-58}/>
          <SL>HONOURS</SL>
          <div style={{textAlign:"center",margin:"4px 0 10px"}}>{f.awards.map(a=><div key={a} style={{fontSize:10,color:P.inkMuted}}>{a}</div>)}</div>
        </>}

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Box office */}
        <SL>BOX OFFICE</SL>
        <div style={{textAlign:"center",margin:"6px 0 10px"}}>
          <div style={{fontSize:30,fontWeight:700,color:P.ink,fontFamily:"var(--b)"}}>{fmt(f.box.cum)}</div>
          <div style={{fontSize:10,color:P.inkFaint}}>cumulative gross</div>
          <div style={{width:80,margin:"6px auto",borderTop:`0.3px solid ${P.inkSoft}`,opacity:0.2}}/>
          <div style={{fontSize:18,fontWeight:600,color:P.inkMuted,fontFamily:"var(--b)"}}>{fmt(f.box.wk)}</div>
          <div style={{fontSize:10,color:P.inkFaint}}>weekend · week {f.box.w}</div>
        </div>

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Watch legally — AVAILABILITY TRACKER */}
        <SL>WHERE TO WATCH</SL>
        {(()=>{
          const avail=AVAIL[f.id]||{};
          const gaps=COUNTRIES.filter(c=>(avail[c.c]||[]).length===0);
          const available=COUNTRIES.filter(c=>(avail[c.c]||[]).length>0);
          return(<div style={{margin:"6px 0 10px"}}>
            {/* Available countries */}
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {available.map(c=><div key={c.c} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",background:"rgba(45,122,58,0.04)",border:`0.3px solid rgba(45,122,58,0.15)`}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>{c.f}</span>
                  <span style={{fontSize:11,color:P.ink,fontWeight:600}}>{c.n}</span>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {avail[c.c].map((s,i)=><a key={i} href="#" style={{fontSize:10,padding:"2px 8px",background:P.white,border:`0.3px solid ${P.border}`,color:P.ink,fontWeight:600,textDecoration:"none",fontFamily:"var(--b)"}}>{s.p}<span style={{color:P.inkFaint,fontWeight:400}}> · {s.t==="sub"?"Sub":s.t==="rent"?"Rent":"Free"}</span></a>)}
                </div>
              </div>)}
            </div>
            {/* Gap alerts */}
            {gaps.length>0&&<div style={{marginTop:8}}>
              <div style={{fontSize:8,color:P.orange,letterSpacing:"0.1em",fontWeight:600,marginBottom:4}}>NOT YET AVAILABLE IN</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {gaps.map(c=><span key={c.c} style={{fontSize:10,padding:"2px 6px",background:"rgba(216,90,48,0.06)",border:`0.3px solid rgba(216,90,48,0.15)`,color:P.orange}}>{c.f} {c.n}</span>)}
              </div>
              <div style={{fontSize:8,color:P.inkFaint,fontStyle:"italic",marginTop:4}}>Distributors: fill this gap and reach {gaps.length} untapped markets</div>
            </div>}
          </div>);
        })()}

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Trailer */}
        <SL>TRAILER</SL>
        {showT?(<div style={{position:"relative",paddingTop:"56.25%",margin:"6px 0 10px"}}><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}} allowFullScreen/></div>):(
        <div onClick={()=>setShowT(true)} style={{position:"relative",paddingTop:"56.25%",cursor:"pointer",margin:"6px 0 10px",background:P.parchDark}}>
          <img src={f.backdrop} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.4)",borderRadius:0}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:44,height:44,borderRadius:"50%",background:P.gold,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,marginLeft:2,color:P.parch}}>▶</span></div></div>
        </div>)}

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* VERIFIED WATCH + RATE */}
        <SL>RATE THIS WORK</SL>
        {(()=>{
          const[verified,setVerified]=useState(false);
          const[method,setMethod]=useState(null);
          const[showVerify,setShowVerify]=useState(false);

          return(<div style={{margin:"6px 0 10px"}}>
            {/* Rating row */}
            <div style={{display:"flex",justifyContent:"center",gap:3,marginBottom:6}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} onClick={()=>setUs(n)} style={{width:28,height:28,border:`0.3px solid ${P.inkSoft}`,background:us&&n<=us?P.inkSoft:P.parch,color:us&&n<=us?P.parch:P.inkFaint,fontWeight:700,fontSize:12,fontFamily:"var(--b)",cursor:"pointer",borderRadius:0}}>{n}</button>)}
            </div>
            {us&&<div style={{textAlign:"center",fontSize:9,color:P.gold,marginBottom:6}}>You scored {us} / 10</div>}

            {/* Verification prompt */}
            {us&&!verified&&<div style={{border:`0.5px solid ${P.green}`,padding:"10px 12px",background:"rgba(45,122,58,0.03)",marginTop:4}}>
              <div style={{fontSize:10,fontWeight:700,color:P.green,marginBottom:4}}>Verify your watch to earn a Verified badge</div>
              <div style={{fontSize:9,color:P.inkMuted,lineHeight:1.5,marginBottom:8}}>Verified ratings carry more weight in M'Bari's scoring system. Only ratings from confirmed legal viewings count toward the Verified Audience score.</div>

              {!showVerify?<button onClick={()=>setShowVerify(true)} style={{width:"100%",padding:"8px",background:P.green,color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Verify my watch</button>:(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:9,color:P.gold,letterSpacing:"0.08em",fontWeight:600}}>HOW DID YOU WATCH?</div>
                {[
                  {m:"cinema",label:"Cinema barcode",desc:"Scan the M'Bari code at your cinema screen"},
                  {m:"ticket",label:"Cinema ticket",desc:"Upload photo or scan of ticket stub"},
                  {m:"streaming",label:"Streaming receipt",desc:"Connect Netflix, Prime, Showmax, iROKOtv, or YouTube Premium"},
                  {m:"code",label:"Distributor code",desc:"Enter the one-time code from your legal copy"},
                ].map(opt=><div key={opt.m} onClick={()=>{setMethod(opt.m);setTimeout(()=>setVerified(true),800);}} style={{
                  padding:"8px 10px",border:`0.3px solid ${method===opt.m?P.green:P.border}`,
                  background:method===opt.m?"rgba(45,122,58,0.06)":P.parch,cursor:"pointer"
                }}>
                  <div style={{fontSize:11,fontWeight:600,color:P.ink}}>{opt.label}</div>
                  <div style={{fontSize:9,color:P.inkFaint}}>{opt.desc}</div>
                </div>)}
              </div>)}
            </div>}

            {/* Verified confirmation */}
            {verified&&<div style={{border:`0.5px solid ${P.green}`,padding:"10px 12px",background:"rgba(45,122,58,0.04)",marginTop:4,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:P.green}}>Verified watch confirmed</div>
              <div style={{fontSize:9,color:P.inkMuted,marginTop:2}}>Your rating of {us}/10 counts toward the Verified Audience score</div>
              <div style={{display:"inline-block",marginTop:6,padding:"2px 10px",background:P.green,color:"#fff",fontSize:9,fontWeight:700,letterSpacing:"0.06em"}}>VERIFIED</div>
            </div>}
          </div>);
        })()}

        <CulturalDivider langCode={primary.code} width={sw-58}/>

        {/* Credit */}
        <div style={{textAlign:"center",margin:"6px 0 4px"}}>
          <div style={{fontSize:7,color:P.inkFaint,fontStyle:"italic"}}>Images: Official press kit · © {f.year} {f.crew[0].n}</div>
        </div>
        <div style={{width:100,margin:"6px auto",borderTop:`0.3px solid ${P.inkSoft}`,opacity:0.2}}/>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"var(--s)",fontSize:9,color:P.gold,letterSpacing:"0.1em"}}>M'BARI</div>
          <div style={{fontSize:7,color:P.inkFaint,fontStyle:"italic"}}>Where culture lives</div>
        </div>

        <CulturalDivider langCode={primary.code} width={sw-58}/>
      </div>
    </div>
  </div>);
}

/* ═══════════ FILM CARD ═══════════ */
function FilmCard({film,onClick,idx=0}){
  const[h,setH]=useState(false);const[ref,v]=useReveal();
  return(<div ref={ref} onClick={()=>onClick(film.id)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
    cursor:"pointer",background:P.white,overflow:"hidden",border:`1px solid ${h?P.gold:P.border}`,
    transition:"all 0.35s ease",transitionDelay:`${idx*0.05}s`,opacity:v?1:0,transform:v?(h?"translateY(-3px)":"none"):"translateY(12px)",
    boxShadow:h?"0 6px 16px rgba(0,0,0,0.06)":"none",minWidth:170,flex:"0 0 170px"
  }}>
    <div style={{position:"relative",paddingTop:"135%",background:P.parchDark}}>
      <img src={film.poster} alt={film.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
    </div>
    <div style={{padding:"8px 10px 12px"}}>
      <div style={{fontFamily:"var(--s)",fontWeight:700,fontSize:14,color:P.ink,lineHeight:1.2,marginBottom:2}}>{film.title}</div>
      <div style={{fontSize:10,color:P.inkFaint}}>{film.year} · {film.lang[0].name}</div>
      <div style={{marginTop:6,fontSize:12}}><span style={{fontWeight:700,color:film.scores.critic>=85?P.green:P.gold}}>{film.scores.critic}</span><span style={{color:P.inkFaint,fontSize:10}}> critic · {film.cc} rev.</span></div>
    </div>
  </div>);
}

/* ═══════════ SIDEBAR STORY ═══════════ */
function SideStory({film,onClick,idx}){
  const[ref,v]=useReveal();
  return(<div ref={ref} onClick={()=>onClick(film.id)} style={{cursor:"pointer",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${P.borderLight}`,opacity:v?1:0,transform:v?"none":"translateY(8px)",transition:`all 0.4s ease ${idx*0.07}s`,display:"flex",gap:8}}>
    <div style={{flex:1}}>
      <div style={{fontFamily:"var(--s)",fontSize:15,fontWeight:700,color:P.ink,lineHeight:1.2,marginBottom:2}}>{film.title}</div>
      <div style={{fontSize:11,color:P.inkFaint}}>{film.year} · {film.genres.join(", ")}</div>
      <div style={{marginTop:4,fontSize:11}}><span style={{fontWeight:700,color:film.scores.critic>=85?P.green:P.gold}}>{film.scores.critic}</span><span style={{color:P.inkFaint}}> critic</span></div>
    </div>
    <img src={film.poster} alt="" style={{width:52,height:72,objectFit:"cover",flexShrink:0}}/>
  </div>);
}

/* ═══════════ FLIPPING HERO ═══════════ */
function FlipHero({films,onSelect}){
  const[idx,setIdx]=useState(0);const[fade,setFade]=useState(true);
  useEffect(()=>{const t=setInterval(()=>{setFade(false);setTimeout(()=>{setIdx(i=>(i+1)%films.length);setFade(true);},300);},5500);return()=>clearInterval(t);},[films.length]);
  const f=films[idx];
  return(<div onClick={()=>onSelect(f.id)} style={{position:"relative",height:380,cursor:"pointer",overflow:"hidden",border:`1px solid ${P.border}`,opacity:fade?1:0,transition:"opacity 0.3s ease"}}>
    <img src={f.backdrop} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to right, rgba(28,22,8,0.88) 0%, rgba(28,22,8,0.4) 50%, transparent 100%)"}}/>
    <div style={{position:"absolute",bottom:0,left:0,padding:"36px 32px",maxWidth:420}}>
      <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em",fontWeight:600,marginBottom:8}}>FEATURED THIS WEEK</div>
      <h2 style={{fontFamily:"var(--s)",fontSize:34,fontWeight:700,color:"#fff",margin:0,lineHeight:1.05}}>{f.title}</h2>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",margin:"6px 0 14px"}}>{f.year} · {f.genres.join(", ")} · {f.lang[0].name}</div>
      <div style={{display:"flex",gap:16}}>
        {[["critic","Critics"],["audience","Audience"],["heat","Heat"]].map(([k,l])=><div key={k} style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:700,color:"#fff"}}>{f.scores[k]}</div><div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em"}}>{l}</div></div>)}
      </div>
    </div>
    <div style={{position:"absolute",bottom:14,right:20,display:"flex",gap:5}}>{films.map((_,i)=><div key={i} style={{width:i===idx?18:5,height:5,borderRadius:3,background:i===idx?"#fff":"rgba(255,255,255,0.25)",transition:"all 0.35s"}}/>)}</div>
  </div>);
}

/* ═══════════ AUTH MODAL ═══════════ */
function AuthModal({onClose,onLogin}){
  const[mode,setMode]=useState("login");
  const inp={width:"100%",padding:"9px 12px",borderRadius:2,border:`1px solid ${P.border}`,background:P.white,color:P.ink,fontSize:13,outline:"none",fontFamily:"var(--b)",boxSizing:"border-box"};
  const btn=(bg,c,bdr)=>({width:"100%",padding:"10px",borderRadius:2,border:bdr||"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"var(--b)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:bg,color:c});
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:P.parch,borderRadius:4,padding:"28px 24px",width:340,maxWidth:"90vw",border:`1px solid ${P.inkSoft}`}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:"var(--s)",fontSize:24,fontWeight:700,color:P.ink,letterSpacing:"0.04em"}}>M'Bari</div>
        <div style={{fontSize:11,color:P.inkFaint,fontStyle:"italic",marginTop:2}}>Where culture lives</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
        <button style={btn(P.white,P.ink,`1px solid ${P.border}`)} onClick={()=>onLogin("g")}><svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Google</button>
        <button style={btn("#1C1608","#fff")} onClick={()=>onLogin("a")}><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>Apple</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0"}}><div style={{flex:1,height:1,background:P.border}}/><span style={{fontSize:8,color:P.inkFaint,letterSpacing:"0.1em"}}>OR</span><div style={{flex:1,height:1,background:P.border}}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <input placeholder="Email" style={inp}/><input placeholder="Password" type="password" style={inp}/>
        <button style={btn(P.ink,P.parch)} onClick={()=>onLogin("e")}>{mode==="login"?"Sign in":"Create account"}</button>
      </div>
      <div style={{textAlign:"center",marginTop:10,fontSize:11,color:P.inkFaint}}>
        {mode==="login"?<>No account? <span style={{color:P.gold,cursor:"pointer",fontWeight:600}} onClick={()=>setMode("s")}>Sign up</span></>:<>Have an account? <span style={{color:P.gold,cursor:"pointer",fontWeight:600}} onClick={()=>setMode("login")}>Sign in</span></>}
      </div>
    </div>
  </div>);
}

/* ═══════════ CREW PROFILE PAGE ═══════════ */
function CrewPage({crewId,nav,back}){
  const d=DIRS[crewId];if(!d)return<div style={{padding:60}}>Not found.</div>;
  const films=d.films.map(id=>FILMS.find(f=>f.id===id)).filter(Boolean);
  const avg=films.length?Math.round(films.reduce((s,f)=>s+f.scores.critic,0)/films.length):0;
  const totalBox=films.reduce((s,f)=>s+f.box.cum,0);
  const isCraft=d.type==="craft";

  return(<div style={{maxWidth:860,margin:"0 auto",padding:"24px 20px 40px"}}>
    <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>
    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:16}}>
      {isCraft&&<div style={{fontSize:8,color:P.green,letterSpacing:"0.1em",fontWeight:700,marginBottom:4}}>CRAFT PROFESSIONAL</div>}
      <h1 style={{fontFamily:"var(--s)",fontSize:28,fontWeight:700,color:P.ink,margin:0}}>{d.name}</h1>
      <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>{d.roles.map(r=><span key={r} style={{fontSize:10,padding:"1px 6px",background:isCraft?"rgba(45,122,58,0.06)":P.parchDark,border:isCraft?`0.3px solid rgba(45,122,58,0.2)`:"none",color:isCraft?P.green:P.gold,fontWeight:600}}>{r}</span>)}</div>
    </div>
    <p style={{color:P.inkMuted,fontSize:14,lineHeight:1.7,maxWidth:560,margin:"0 0 14px"}}>{d.bio}</p>

    {/* Stats row */}
    <div style={{display:"flex",gap:20,marginBottom:16,flexWrap:"wrap"}}>
      <div><span style={{fontWeight:700,fontSize:18,color:P.gold}}>{films.length}</span><span style={{color:P.inkFaint,fontSize:11,marginLeft:4}}>films</span></div>
      <div><span style={{fontWeight:700,fontSize:18,color:P.gold}}>{avg}</span><span style={{color:P.inkFaint,fontSize:11,marginLeft:4}}>avg. critic score</span></div>
      <div><span style={{fontWeight:700,fontSize:18,color:P.gold}}>{fmt(totalBox)}</span><span style={{color:P.inkFaint,fontSize:11,marginLeft:4}}>combined box office</span></div>
    </div>

    {d.awards.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>{d.awards.map(a=><span key={a} style={{fontSize:9,padding:"2px 8px",background:P.parchDark,border:`0.3px solid ${P.border}`,color:P.gold,fontWeight:600}}>{a}</span>)}</div>}

    {/* Availability for hire signal — craft only */}
    {isCraft&&<div style={{padding:"10px 12px",background:"rgba(45,122,58,0.03)",border:`0.5px solid ${P.green}`,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:P.green}}>Available for projects</div>
          <div style={{fontSize:9,color:P.inkFaint}}>Based in Lagos, Nigeria · Open to travel</div>
        </div>
        <button style={{padding:"4px 12px",background:P.green,color:"#fff",border:"none",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Contact</button>
      </div>
    </div>}

    {/* Filmography */}
    <div style={{borderTop:`2px solid ${P.ink}`,paddingTop:8,marginBottom:8}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:P.ink}}>FILMOGRAPHY</span>
    </div>
    {films.map((f,i)=><div key={f.id} onClick={()=>nav("film",f.id)} style={{cursor:"pointer",display:"flex",gap:10,paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${P.borderLight}`,alignItems:"center"}}>
      <img src={f.poster} alt="" style={{width:48,height:66,objectFit:"cover",flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontFamily:"var(--s)",fontSize:15,fontWeight:700,color:P.ink,lineHeight:1.2}}>{f.title}</div>
        <div style={{fontSize:11,color:P.inkFaint}}>{f.year} · {f.genres.join(", ")}</div>
        <div style={{fontSize:10,color:P.inkMuted,marginTop:2}}>{(FULL_CREW[f.id]?.above||[]).concat(FULL_CREW[f.id]?.craft||[]).filter(c=>c.id===crewId).map(c=>c.r).join(", ")}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:18,fontWeight:700,color:f.scores.critic>=85?P.green:P.gold}}>{f.scores.critic}</div>
        <div style={{fontSize:8,color:P.inkFaint}}>critic</div>
        <div style={{fontSize:11,color:P.inkMuted,fontWeight:600,marginTop:2}}>{fmt(f.box.cum)}</div>
      </div>
    </div>)}
  </div>);
}

/* ═══════════ LANGUAGE PAGE ═══════════ */
function LangPage({code,nav,back}){
  const lang=LANGS.find(l=>l.code===code);if(!lang)return<div style={{padding:60}}>Not found.</div>;
  const films=FILMS.filter(f=>f.lang.some(l=>l.code===code));
  return(<div style={{maxWidth:860,margin:"0 auto",padding:"24px 20px 40px"}}>
    <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>
    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:16}}>
      <div style={{fontSize:12,color:P.gold,fontFamily:"var(--s)",fontStyle:"italic"}}>{lang.native}</div>
      <h1 style={{fontFamily:"var(--s)",fontSize:28,fontWeight:700,color:P.ink,margin:"2px 0 4px"}}>{lang.name} language cinema</h1>
      <div style={{fontSize:12,color:P.inkFaint}}>{lang.region} · {lang.count.toLocaleString()} films</div>
    </div>
    <div style={{marginBottom:8}}><CulturalDivider langCode={code} width={300}/></div>
    {films.map((f,i)=><SideStory key={f.id} film={f} onClick={()=>nav("film",f.id)} idx={i}/>)}
  </div>);
}

/* ═══════════ SUBMIT PAGE ═══════════ */
function SubmitPage({back}){
  const[step,setStep]=useState(1);
  const inp={width:"100%",padding:"9px 12px",borderRadius:2,border:`1px solid ${P.border}`,background:P.white,color:P.ink,fontSize:13,outline:"none",fontFamily:"var(--b)",boxSizing:"border-box"};
  return(<div style={{maxWidth:560,margin:"0 auto",padding:"24px 20px 40px"}}>
    <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>
    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:16}}>
      <h1 style={{fontFamily:"var(--s)",fontSize:24,fontWeight:700,color:P.ink,margin:0}}>Submit a film</h1>
      <p style={{color:P.inkFaint,fontSize:12,marginTop:4}}>All submissions reviewed by our editorial team. We verify titles, credits, and legal distribution status.</p>
    </div>
    <div style={{display:"flex",gap:3,marginBottom:20}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:2,background:s<=step?P.ink:P.borderLight}}/>)}</div>

    {step===1&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      <div style={{fontSize:9,color:P.gold,letterSpacing:"0.1em",fontWeight:600}}>BASIC INFORMATION</div>
      <input placeholder="Film title" style={inp}/><input placeholder="Year of release" style={inp}/><input placeholder="Country of origin" style={inp}/>
      <input placeholder="Runtime (minutes)" style={inp}/>
      <select style={{...inp,appearance:"none"}}><option value="">Primary language</option>{LANGS.map(l=><option key={l.code} value={l.code}>{l.name} ({l.native})</option>)}</select>
      <button onClick={()=>setStep(2)} style={{padding:"10px",background:P.ink,color:P.parch,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"var(--b)"}}>Next: Credits →</button>
    </div>}

    {step===2&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      <div style={{fontSize:9,color:P.gold,letterSpacing:"0.1em",fontWeight:600}}>CREDITS AND LINKS</div>
      <input placeholder="Director(s)" style={inp}/><input placeholder="Producer(s)" style={inp}/><input placeholder="Lead cast (comma separated)" style={inp}/>
      <input placeholder="YouTube trailer URL" style={inp}/>
      <input placeholder="Legal streaming link (Netflix, Prime, etc.)" style={inp}/>
      <textarea placeholder="Synopsis" rows={3} style={{...inp,resize:"vertical"}}/>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>setStep(1)} style={{flex:1,padding:"10px",background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"var(--b)"}}>← Back</button>
        <button onClick={()=>setStep(3)} style={{flex:1,padding:"10px",background:P.ink,color:P.parch,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"var(--b)"}}>Next: Verify →</button>
      </div>
    </div>}

    {step===3&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      <div style={{fontSize:9,color:P.gold,letterSpacing:"0.1em",fontWeight:600}}>VERIFICATION</div>
      <div style={{padding:14,background:P.parchDark,border:`1px solid ${P.border}`}}>
        <div style={{fontWeight:600,fontSize:12,color:P.ink,marginBottom:6}}>Your relationship to this film</div>
        {["I am the director/producer","I represent the production company","I am a verified critic","Community contributor"].map(o=><label key={o} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:P.inkMuted,marginBottom:4,cursor:"pointer"}}><input type="radio" name="rel" style={{accentColor:P.gold}}/>{o}</label>)}
      </div>
      <input placeholder="Your name" style={inp}/><input placeholder="Your email" style={inp}/>
      <div style={{fontSize:10,color:P.inkFaint,lineHeight:1.5}}>By submitting, you confirm all information is accurate. Submissions are reviewed within 48 hours.</div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>setStep(2)} style={{flex:1,padding:"10px",background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"var(--b)"}}>← Back</button>
        <button style={{flex:1,padding:"10px",background:P.ink,color:P.parch,border:"none",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"var(--b)"}}>Submit for review</button>
      </div>
    </div>}
  </div>);
}

/* ═══════════ HOMEPAGE ═══════════ */
function Home({nav}){
  const hot=[...FILMS].sort((a,b)=>b.scores.heat-a.scores.heat);
  const topC=[...FILMS].sort((a,b)=>b.scores.critic-a.scores.critic);
  const boxSorted=[...FILMS].sort((a,b)=>b.box.cum-a.box.cum);
  const lead=hot[0];const side=hot.slice(1,4);
  const[r1,v1]=useReveal();const[r2,v2]=useReveal();

  return(<div>
    {/* Masthead */}
    <div style={{maxWidth:1060,margin:"0 auto",padding:"14px 20px 0"}}>
      <div style={{textAlign:"center",padding:"6px 0",borderBottom:`2px solid ${P.ink}`}}>
        <div style={{fontFamily:"var(--s)",fontSize:36,fontWeight:700,color:P.ink,letterSpacing:"0.02em",lineHeight:1}}>M'Bari</div>
        <div style={{fontSize:9,color:P.inkFaint,fontStyle:"italic",marginTop:2}}>Where culture lives</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${P.border}`,fontSize:10,color:P.inkFaint}}>
        <span>Saturday, March 14, 2026</span>
        <span>Lagos · Johannesburg · Accra · Nairobi</span>
      </div>
    </div>

    {/* Broadsheet grid: hero + sidebar */}
    <div style={{maxWidth:1060,margin:"16px auto 0",padding:"0 20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:0}}>
        {/* Lead */}
        <div style={{paddingRight:20,borderRight:`1px solid ${P.border}`}}>
          <FlipHero films={hot} onSelect={id=>nav("film",id)}/>
          <div style={{borderTop:`1px solid ${P.border}`,marginTop:12,paddingTop:10}}>
            <div style={{fontSize:11,color:P.inkMuted}}>
              <span style={{fontWeight:600,color:P.ink}}>Director:</span>{" "}
              <span style={{color:P.gold,cursor:"pointer",fontWeight:600}} onClick={()=>nav("director",lead.crew[0].id)}>{lead.crew[0].n}</span>
              <span style={{color:P.inkFaint}}> · {lead.lang[0].name} · {lead.country}</span>
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div style={{paddingLeft:20}}>
          <div style={{fontFamily:"var(--s)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink,marginBottom:10}}>ALSO TRENDING</div>
          {side.map((f,i)=><SideStory key={f.id} film={f} onClick={()=>nav("film",f.id)} idx={i}/>)}
          <div style={{borderTop:`1px solid ${P.border}`,paddingTop:10,marginTop:4}}>
            <div style={{fontFamily:"var(--s)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink,marginBottom:8}}>BOX OFFICE TOP 3</div>
            {boxSorted.slice(0,3).map((f,i)=><div key={f.id} onClick={()=>nav("film",f.id)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:6,marginBottom:6,borderBottom:i<2?`1px solid ${P.borderLight}`:"none"}}>
              <div><span style={{fontWeight:700,color:i===0?P.gold:P.inkFaint,marginRight:6}}>{i+1}</span><span style={{fontFamily:"var(--s)",fontWeight:600,fontSize:13,color:P.ink}}>{f.title}</span></div>
              <span style={{fontSize:12,fontWeight:600,color:i===0?P.gold:P.inkMuted,fontFamily:"var(--b)"}}>{fmt(f.box.cum)}</span>
            </div>)}
          </div>
        </div>
      </div>
    </div>

    {/* Full width sections below */}
    <div style={{maxWidth:1060,margin:"24px auto 0",padding:"0 20px"}}>
      {/* Box office full */}
      <div ref={r1} style={{marginBottom:28,opacity:v1?1:0,transform:v1?"none":"translateY(12px)",transition:"all 0.5s ease"}}>
        <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:4,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:4}}>
            <div><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink}}>BOX OFFICE</span><span style={{fontSize:10,color:P.inkFaint,marginLeft:8}}>Week ending 14 March 2026</span></div>
            <span style={{fontSize:9,color:P.green,fontWeight:600,cursor:"pointer"}}>Cinema partners: get live data →</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 72px 82px 32px 48px",fontSize:9,color:P.inkFaint,letterSpacing:"0.08em",fontWeight:600,paddingBottom:4,borderBottom:`1px solid ${P.border}`}}>
          <span style={{textAlign:"center"}}>#</span><span>TITLE</span><span style={{textAlign:"right"}}>WKND</span><span style={{textAlign:"right"}}>TOTAL</span><span style={{textAlign:"center"}}>WK</span><span></span>
        </div>
        {boxSorted.map((f,i)=><div key={f.id} onClick={()=>nav("film",f.id)} style={{display:"grid",gridTemplateColumns:"36px 1fr 72px 82px 32px 48px",padding:"8px 0",borderBottom:`1px solid ${P.borderLight}`,cursor:"pointer",alignItems:"center",background:i===0?P.parchDark:"transparent"}}>
          <span style={{fontWeight:700,fontSize:16,color:i===0?P.gold:P.inkMuted,textAlign:"center"}}>{i+1}</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src={f.poster} alt="" style={{width:26,height:36,objectFit:"cover"}}/>
            <div><div style={{fontFamily:"var(--s)",fontWeight:600,fontSize:13,color:P.ink}}>{f.title}</div><div style={{fontSize:10,color:P.inkFaint}}>{f.lang[0].name}</div></div>
          </div>
          <span style={{textAlign:"right",fontWeight:600,fontSize:12,color:P.ink}}>{fmt(f.box.wk)}</span>
          <span style={{textAlign:"right",fontWeight:600,fontSize:12,color:i===0?P.gold:P.inkMuted}}>{fmt(f.box.cum)}</span>
          <span style={{textAlign:"right",fontSize:11,color:P.inkFaint}}>{f.box.w}</span>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            {f.box.live?<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,fontWeight:700,color:P.green,padding:"2px 6px",background:"rgba(45,122,58,0.06)",border:`0.3px solid rgba(45,122,58,0.2)`}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:P.green,animation:"livepulse 1.5s ease infinite"}}/>LIVE
            </span>:<span style={{fontSize:8,color:P.inkFaint}}>Reported</span>}
          </div>
        </div>)}

        {/* Cinema partner — subtle */}
        <div style={{marginTop:10,paddingTop:8,borderTop:`0.5px solid ${P.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
          <div style={{fontSize:9,color:P.inkFaint}}>
            <span style={{fontWeight:600,color:P.inkMuted}}>M'Bari cinema barcodes</span> — verified box office data from partner cinemas. Pricing per screen, per country, fair and transparent. <span style={{color:P.gold,cursor:"pointer"}}>Learn more</span>
          </div>
        </div>
      </div>

      {/* Critics picks */}
      <div ref={r2} style={{marginBottom:28,opacity:v2?1:0,transform:v2?"none":"translateY(12px)",transition:"all 0.5s ease"}}>
        <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:4,marginBottom:10}}><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink}}>CRITICS' PICKS</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",gap:12}}>
          {topC.slice(0,4).map(f=><div key={f.id} onClick={()=>nav("film",f.id)} style={{cursor:"pointer",borderBottom:`1px solid ${P.border}`,paddingBottom:10}}>
            <img src={f.backdrop} alt="" style={{width:"100%",height:110,objectFit:"cover",marginBottom:8}}/>
            <div style={{fontFamily:"var(--s)",fontSize:15,fontWeight:700,color:P.ink,lineHeight:1.2}}>{f.title}</div>
            <div style={{fontSize:10,color:P.inkFaint,marginTop:2}}>{f.year} · {f.lang[0].name}</div>
            <div style={{marginTop:4}}><span style={{fontWeight:700,color:f.scores.critic>=85?P.green:P.gold}}>{f.scores.critic}</span><span style={{color:P.inkFaint,fontSize:10}}> · {f.cc} reviews</span></div>
          </div>)}
        </div>
      </div>

      {/* Languages */}
      <div style={{marginBottom:28}}>
        <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:4,marginBottom:10}}><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink}}>LANGUAGE CINEMA</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(155px, 1fr))",gap:1,background:P.border}}>
          {LANGS.slice(0,8).map(l=><div key={l.code} onClick={()=>nav("language",l.code)} style={{padding:"10px 12px",background:P.white,cursor:"pointer"}}>
            <div style={{fontFamily:"var(--s)",fontWeight:600,fontSize:13,color:P.ink}}>{l.name}</div>
            <div style={{fontSize:10,color:P.gold}}>{l.native}</div>
            <div style={{fontSize:9,color:P.inkFaint,marginTop:2}}>{l.count.toLocaleString()} films</div>
          </div>)}
        </div>
      </div>

      {/* ═══════════ LIVE EVENTS SECTION ═══════════ */}
      <div style={{marginBottom:28}}>
        <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:4,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:P.ink}}>LIVE AND EVENTS</span><span style={{fontSize:10,color:P.inkFaint,marginLeft:8}}>Concerts · Theatre · Festivals · Fairs</span></div>
            <span onClick={()=>nav("events")} style={{fontSize:9,color:P.gold,fontWeight:600,cursor:"pointer"}}>View all →</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:12}}>
          {EVENTS.map((ev,i)=><div key={ev.id} onClick={()=>nav("event",ev.id)} style={{cursor:"pointer",border:`1px solid ${P.border}`,background:P.white}}>
            <div style={{position:"relative",height:120,overflow:"hidden",background:P.parchDark}}>
              <img src={ev.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              {ev.live&&<span style={{position:"absolute",top:8,left:8,display:"inline-flex",alignItems:"center",gap:3,fontSize:8,fontWeight:700,color:"#fff",padding:"2px 8px",background:P.green}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"#fff",animation:"livepulse 1.5s ease infinite"}}/>LIVE NOW
              </span>}
              {ev.barcode&&<span style={{position:"absolute",top:8,right:8,fontSize:7,fontWeight:700,color:P.green,padding:"2px 6px",background:"rgba(255,255,255,0.92)",border:`0.3px solid ${P.green}`}}>M'BARI BARCODE</span>}
            </div>
            <div style={{padding:"10px 12px"}}>
              <div style={{fontSize:8,color:P.gold,letterSpacing:"0.08em",fontWeight:600,marginBottom:2}}>{ev.type}</div>
              <div style={{fontFamily:"var(--s)",fontWeight:700,fontSize:14,color:P.ink,lineHeight:1.2,marginBottom:3}}>{ev.title}</div>
              <div style={{fontSize:11,color:P.inkMuted}}>{ev.venue}</div>
              <div style={{fontSize:10,color:P.inkFaint,marginTop:2}}>{ev.date} · {ev.city}</div>
              {ev.scores&&<div style={{marginTop:6,display:"flex",gap:8}}>
                <span style={{fontSize:11}}><span style={{fontWeight:700,color:P.green}}>{ev.scores.audience}</span><span style={{color:P.inkFaint,fontSize:9}}> audience</span></span>
                {ev.scores.verified&&<span style={{fontSize:11}}><span style={{fontWeight:700,color:P.green}}>{ev.scores.verified}</span><span style={{color:P.inkFaint,fontSize:9}}> verified</span></span>}
              </div>}
            </div>
          </div>)}
        </div>
      </div>

      {/* CTA */}
      <div style={{margin:"0 0 16px",padding:"16px 20px",background:P.parchDark,border:`1px solid ${P.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontFamily:"var(--s)",fontSize:15,fontWeight:700,color:P.ink}}>Are you a filmmaker?</div><div style={{color:P.inkFaint,fontSize:12}}>Submit your film. Get scored. Get discovered.</div></div>
        <button onClick={()=>nav("submit")} style={{padding:"7px 14px",border:`1px solid ${P.gold}`,background:"none",color:P.gold,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"var(--b)"}}>Submit →</button>
      </div>
      <div style={{margin:"0 0 32px",padding:"16px 20px",background:"rgba(45,122,58,0.03)",border:`0.5px solid ${P.green}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontFamily:"var(--s)",fontSize:15,fontWeight:700,color:P.green}}>Organising an event?</div><div style={{color:P.inkFaint,fontSize:12}}>Get M'Bari barcodes for your show. Verified audience data, real-time sentiment, live badges.</div></div>
        <button onClick={()=>nav("submit")} style={{padding:"7px 14px",border:`1px solid ${P.green}`,background:"none",color:P.green,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"var(--b)"}}>Partner with us →</button>
      </div>
    </div>
  </div>);
}

/* ═══════════ EVENT PAGE ═══════════ */
function EventPage({eventId,nav,back}){
  const ev=EVENTS.find(e=>e.id===eventId);
  if(!ev)return<div style={{padding:60}}>Event not found.</div>;
  return(<div style={{maxWidth:860,margin:"0 auto",padding:"24px 20px 40px"}}>
    <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>
    <div style={{position:"relative",height:240,overflow:"hidden",marginBottom:16}}>
      <img src={ev.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(28,22,8,0.8) 0%, transparent 50%)"}}/>
      <div style={{position:"absolute",bottom:16,left:16,display:"flex",gap:6,alignItems:"center"}}>
        {ev.live&&<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,fontWeight:700,color:"#fff",padding:"3px 10px",background:P.green}}><span style={{width:5,height:5,borderRadius:"50%",background:"#fff",animation:"livepulse 1.5s ease infinite"}}/>LIVE NOW</span>}
        {ev.barcode&&<span style={{fontSize:8,fontWeight:700,color:P.green,padding:"3px 8px",background:"rgba(255,255,255,0.92)"}}>M'BARI BARCODE ACTIVE</span>}
      </div>
    </div>
    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:14}}>
      <div style={{fontSize:8,color:P.gold,letterSpacing:"0.1em",fontWeight:600}}>{ev.type}</div>
      <h1 style={{fontFamily:"var(--s)",fontSize:26,fontWeight:700,color:P.ink,margin:"2px 0 4px"}}>{ev.title}</h1>
      <div style={{fontSize:13,color:P.inkMuted}}>{ev.venue} · {ev.city}</div>
      <div style={{fontSize:12,color:P.inkFaint,marginTop:2}}>{ev.date} · Capacity: {ev.capacity}</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
      <div style={{padding:"12px 14px",border:`1px solid ${P.border}`}}>
        <div style={{fontSize:9,color:P.gold,letterSpacing:"0.08em",fontWeight:600,marginBottom:4}}>TICKETS</div>
        <div style={{fontSize:16,fontWeight:700,color:P.ink}}>{ev.tickets}</div>
      </div>
      {ev.scores?<div style={{padding:"12px 14px",border:`1px solid ${P.green}`,background:"rgba(45,122,58,0.03)"}}>
        <div style={{fontSize:9,color:P.green,letterSpacing:"0.08em",fontWeight:600,marginBottom:4}}>AUDIENCE SCORE</div>
        <div style={{display:"flex",gap:12}}>
          <div><span style={{fontSize:20,fontWeight:700,color:P.green}}>{ev.scores.audience}</span><span style={{fontSize:9,color:P.inkFaint,marginLeft:3}}>all</span></div>
          {ev.scores.verified&&<div><span style={{fontSize:20,fontWeight:700,color:P.green}}>{ev.scores.verified}</span><span style={{fontSize:9,color:P.inkFaint,marginLeft:3}}>verified</span></div>}
        </div>
      </div>:<div style={{padding:"12px 14px",border:`1px solid ${P.border}`}}>
        <div style={{fontSize:9,color:P.gold,letterSpacing:"0.08em",fontWeight:600,marginBottom:4}}>SCORES</div>
        <div style={{fontSize:12,color:P.inkFaint}}>Not yet rated — attend and be first</div>
      </div>}
    </div>

    {ev.barcode&&<div style={{padding:"14px 16px",background:"rgba(45,122,58,0.03)",border:`0.5px solid ${P.green}`,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:P.green}}>M'Bari barcode active at this event</div>
          <div style={{fontSize:10,color:P.inkMuted,marginTop:2}}>Scan the code at the venue to verify your attendance and rate instantly</div>
        </div>
        <div style={{width:40,height:40,border:`1px solid ${P.ink}`,display:"flex",alignItems:"center",justifyContent:"center",background:P.white,flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,3px)",gridTemplateRows:"repeat(4,3px)",gap:1}}>
            {[1,1,0,1,0,1,1,0,1,0,0,1,1,1,1,0].map((v,i)=><div key={i} style={{background:v?P.ink:"transparent",width:3,height:3}}/>)}
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

/* ═══════════ ADMIN BACKEND ═══════════ */
function AdminPage({nav,back}){
  const[filter,setFilter]=useState("all");
  const[queue,setQueue]=useState(ADMIN_QUEUE);
  const filtered=filter==="all"?queue:queue.filter(q=>q.status===filter);

  const statusColor={pending:P.gold,approved:P.green,rejected:P.red};
  const typeIcon={film:"F",article:"A",event:"E",crew:"C"};

  return(<div style={{maxWidth:1060,margin:"0 auto",padding:"24px 20px 40px"}}>
    <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>

    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:16}}>
      <h1 style={{fontFamily:"var(--s)",fontSize:24,fontWeight:700,color:P.ink,margin:0}}>M'Bari Admin Centre</h1>
      <div style={{fontSize:11,color:P.inkFaint,marginTop:2}}>Content submissions, approvals, and editorial queue</div>
    </div>

    {/* Stats row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:8,marginBottom:16}}>
      {[["Pending",queue.filter(q=>q.status==="pending").length,P.gold],["Approved",queue.filter(q=>q.status==="approved").length,P.green],["Rejected",queue.filter(q=>q.status==="rejected").length,P.red],["Total",queue.length,P.ink]].map(([label,count,col])=>(
        <div key={label} style={{padding:"10px 14px",border:`1px solid ${P.border}`,background:P.white}}>
          <div style={{fontSize:22,fontWeight:700,color:col}}>{count}</div>
          <div style={{fontSize:9,color:P.inkFaint,letterSpacing:"0.06em"}}>{label}</div>
        </div>
      ))}
    </div>

    {/* Filter tabs */}
    <div style={{display:"flex",gap:0,marginBottom:14,borderBottom:`1px solid ${P.border}`}}>
      {["all","pending","approved","rejected"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{
        padding:"6px 14px",border:"none",borderBottom:filter===f?`2px solid ${P.ink}`:"2px solid transparent",
        background:"none",color:filter===f?P.ink:P.inkFaint,fontSize:11,fontWeight:filter===f?700:400,
        cursor:"pointer",fontFamily:"var(--b)",textTransform:"capitalize"
      }}>{f}</button>)}
    </div>

    {/* Queue */}
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {filtered.map(q=><div key={q.id} style={{display:"grid",gridTemplateColumns:"32px 1fr 100px 80px",gap:12,padding:"12px 0",borderBottom:`1px solid ${P.borderLight}`,alignItems:"start"}}>
        {/* Type badge */}
        <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:P.parchDark,fontSize:11,fontWeight:700,color:P.gold}}>{typeIcon[q.type]}</div>

        {/* Content */}
        <div>
          <div style={{fontFamily:"var(--s)",fontSize:14,fontWeight:700,color:P.ink,lineHeight:1.2}}>{q.title}</div>
          <div style={{fontSize:11,color:P.inkMuted,marginTop:2}}>{q.excerpt}</div>
          <div style={{fontSize:10,color:P.inkFaint,marginTop:4}}>by {q.submitter} · {q.date} · {q.type}</div>
          {q.hasDesign&&<div style={{marginTop:4,display:"inline-flex",alignItems:"center",gap:4,fontSize:9,padding:"2px 8px",background:"rgba(139,112,64,0.06)",border:`0.3px solid ${P.gold}`,color:P.gold,fontWeight:600}}>
            HAS ORIGINAL DESIGN
            {q.designNote&&<span style={{fontWeight:400,color:P.inkFaint}}> · {q.designNote}</span>}
          </div>}
        </div>

        {/* Status */}
        <div style={{textAlign:"right"}}>
          <span style={{fontSize:9,fontWeight:700,color:statusColor[q.status],padding:"2px 8px",background:`${statusColor[q.status]}10`,border:`0.3px solid ${statusColor[q.status]}30`,textTransform:"uppercase",letterSpacing:"0.06em"}}>{q.status}</span>
        </div>

        {/* Actions */}
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {q.status==="pending"&&<>
            <button onClick={()=>setQueue(prev=>prev.map(p=>p.id===q.id?{...p,status:"approved"}:p))} style={{padding:"4px 8px",background:P.green,color:"#fff",border:"none",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Approve</button>
            <button onClick={()=>setQueue(prev=>prev.map(p=>p.id===q.id?{...p,status:"rejected"}:p))} style={{padding:"4px 8px",background:"none",border:`0.5px solid ${P.red}`,color:P.red,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Reject</button>
            {q.hasDesign&&<button style={{padding:"4px 8px",background:"none",border:`0.5px solid ${P.gold}`,color:P.gold,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Preview design</button>}
          </>}
          {q.status==="approved"&&<span style={{fontSize:9,color:P.inkFaint}}>Published</span>}
          {q.status==="rejected"&&<button onClick={()=>setQueue(prev=>prev.map(p=>p.id===q.id?{...p,status:"pending"}:p))} style={{padding:"4px 8px",background:"none",border:`0.5px solid ${P.gold}`,color:P.gold,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Reconsider</button>}
        </div>
      </div>)}
    </div>

    {/* Design preservation note */}
    <div style={{marginTop:20,padding:"14px 16px",background:P.parchDark,border:`1px solid ${P.border}`}}>
      <div style={{fontSize:11,fontWeight:700,color:P.ink,marginBottom:4}}>Design preservation policy</div>
      <div style={{fontSize:11,color:P.inkMuted,lineHeight:1.6}}>Submissions tagged "Has original design" retain their submitted layout, typography, and imagery when published on M'Bari. Approved designed content renders as submitted — we do not strip formatting or reduce to plain text. This preserves the contributor's editorial intent and ensures M'Bari serves as a platform for African cultural voices, not just a database.</div>
    </div>

    {/* ═══════════ API & DATA INFRASTRUCTURE ═══════════ */}
    <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginTop:24,marginBottom:16}}>
      <h2 style={{fontFamily:"var(--s)",fontSize:20,fontWeight:700,color:P.ink,margin:0}}>Data infrastructure</h2>
      <div style={{fontSize:11,color:P.inkFaint,marginTop:2}}>M'Bari as the canonical source for African cultural data</div>
    </div>

    {/* Data stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))",gap:8,marginBottom:16}}>
      {[["Films indexed","4,847","Verified titles"],["Crew profiles","12,340","Above + craft"],["Events tracked","892","Live + upcoming"],["Countries covered","28","Availability data"],["Languages","47","Classified films"],["API calls / day","34,200","External consumers"],["Verified ratings","2.1M","Legal watch proof"],["Social signals","8.4M","X + TikTok scraped"]].map(([label,value,sub])=>(
        <div key={label} style={{padding:"10px 12px",border:`1px solid ${P.border}`,background:P.white}}>
          <div style={{fontSize:18,fontWeight:700,color:P.ink}}>{value}</div>
          <div style={{fontSize:9,fontWeight:600,color:P.gold,letterSpacing:"0.04em"}}>{label}</div>
          <div style={{fontSize:8,color:P.inkFaint}}>{sub}</div>
        </div>
      ))}
    </div>

    {/* API endpoints */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:P.ink,marginBottom:8}}>API ENDPOINTS</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {[
          {method:"GET",path:"/v1/films/{id}",desc:"Full film record — metadata, scores, crew, availability, box office",consumers:"AI models, media, streamers"},
          {method:"GET",path:"/v1/films/{id}/scores",desc:"All four scores with provenance and count breakdowns",consumers:"Widgets, badges, embeds"},
          {method:"GET",path:"/v1/films/{id}/availability",desc:"Country-by-country legal watch links with gap alerts",consumers:"Distributors, streamers, AI"},
          {method:"GET",path:"/v1/crew/{id}",desc:"Full crew profile — filmography, aggregate stats, availability",consumers:"Production companies, AI"},
          {method:"GET",path:"/v1/boxoffice/weekly",desc:"Box office rankings with live/reported distinction",consumers:"Press, analytics, AI models"},
          {method:"GET",path:"/v1/heat/{id}",desc:"Social sentiment — X, TikTok, engagement velocity",consumers:"Marketing, AI training data"},
          {method:"GET",path:"/v1/languages/{code}/films",desc:"Films by language classification with percentage breakdown",consumers:"Cultural research, AI"},
          {method:"GET",path:"/v1/events",desc:"Live events, festivals, concerts with barcode status",consumers:"Ticketing, media, AI"},
          {method:"POST",path:"/v1/verify/watch",desc:"Submit watch verification — cinema barcode, streaming receipt, ticket",consumers:"M'Bari app, partner cinemas"},
          {method:"GET",path:"/v1/bulk/export",desc:"Full database export — JSON-LD with schema.org markup",consumers:"AI training pipelines"}
        ].map((ep,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"44px 1fr",gap:8,padding:"8px 10px",border:`0.5px solid ${P.borderLight}`,background:i%2===0?P.white:"transparent"}}>
          <span style={{fontSize:9,fontWeight:700,color:ep.method==="POST"?P.orange:P.green,fontFamily:"monospace",padding:"2px 0"}}>{ep.method}</span>
          <div>
            <div style={{fontSize:11,fontFamily:"monospace",color:P.ink,fontWeight:600}}>{ep.path}</div>
            <div style={{fontSize:10,color:P.inkMuted,marginTop:1}}>{ep.desc}</div>
            <div style={{fontSize:9,color:P.inkFaint,marginTop:2}}>Consumers: {ep.consumers}</div>
          </div>
        </div>)}
      </div>
    </div>

    {/* Data licensing tiers */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:P.ink,marginBottom:8}}>DATA LICENSING</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {tier:"Media",price:"Free / attributed",desc:"Score badges, film metadata, embeddable widgets. Must link back to M'Bari. For blogs, newspapers, cinema sites.",limit:"1,000 calls/day"},
          {tier:"Industry",price:"$200–2,000/mo",desc:"Full API access. Box office feeds, availability data, crew database, sentiment analytics. For distributors, streamers, production companies.",limit:"50,000 calls/day"},
          {tier:"AI / Enterprise",price:"Custom",desc:"Bulk data exports, training-grade datasets, real-time retrieval endpoints. JSON-LD with full provenance. For AI companies, research institutions, governments.",limit:"Unlimited"}
        ].map(t=><div key={t.tier} style={{padding:"14px 16px",border:`1px solid ${P.border}`,background:P.white}}>
          <div style={{fontSize:13,fontWeight:700,color:P.ink,fontFamily:"var(--s)"}}>{t.tier}</div>
          <div style={{fontSize:14,fontWeight:700,color:P.gold,marginTop:4}}>{t.price}</div>
          <div style={{fontSize:10,color:P.inkMuted,marginTop:6,lineHeight:1.5}}>{t.desc}</div>
          <div style={{fontSize:9,color:P.inkFaint,marginTop:6,borderTop:`0.5px solid ${P.borderLight}`,paddingTop:4}}>{t.limit}</div>
        </div>)}
      </div>
    </div>

    {/* Data quality signals */}
    <div style={{padding:"14px 16px",background:P.parchDark,border:`1px solid ${P.border}`}}>
      <div style={{fontSize:11,fontWeight:700,color:P.ink,marginBottom:6}}>Why M'Bari data is different</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          ["Verified, not scraped","Every score traces back to a verified watch or approved critic review. No bots. No fake ratings."],
          ["Provenance on everything","Every data point has a source, a timestamp, and a confidence level. AI models can assess reliability."],
          ["Live box office","Cinema barcode scans provide real-time ground-truth, not self-reported estimates."],
          ["Social with attribution","Heat scores source from X and TikTok with post-level attribution, not black-box sentiment."],
          ["Multilingual native","47 African languages classified at the film level. Language data is first-class, not metadata."],
          ["Crew as first-class entities","12,000+ professionals — not just directors. Colourists, editors, sound designers, all with filmographies."]
        ].map(([title,desc])=><div key={title}>
          <div style={{fontSize:10,fontWeight:700,color:P.green}}>{title}</div>
          <div style={{fontSize:10,color:P.inkMuted,lineHeight:1.5,marginTop:2}}>{desc}</div>
        </div>)}
      </div>
    </div>
  </div>);
}
export default function App(){
  const[pg,setPg]=useState({t:"home"});const[h,setH]=useState([]);const[auth,setAuth]=useState(false);const[user,setUser]=useState(null);
  const nav=(t,id)=>{setH(p=>[...p,pg]);setPg({t,id});window.scrollTo({top:0,behavior:"smooth"});};
  const back=()=>{if(h.length){setPg(h.at(-1));setH(p=>p.slice(0,-1));}else setPg({t:"home"});};

  return(<div style={{"--s":"'Libre Baskerville', Georgia, serif","--b":"'Source Sans 3', 'Helvetica Neue', sans-serif",fontFamily:"var(--b)",background:P.bg,minHeight:"100vh",color:P.ink,WebkitFontSmoothing:"antialiased"}}>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <style>{`*{margin:0;padding:0;box-sizing:border-box;}body{background:${P.bg};}::selection{background:${P.parchDark};}::-webkit-scrollbar{height:3px;width:3px;}::-webkit-scrollbar-thumb{background:${P.border};border-radius:4px;}a{color:inherit;text-decoration:none;}@keyframes livepulse{0%,100%{opacity:1;}50%{opacity:0.3;}}`}</style>

    {/* Nav */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:P.navBg,padding:"0 20px",display:"flex",justifyContent:"center",height:34}}>
      <div style={{width:"100%",maxWidth:1060,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span onClick={()=>{setH([]);setPg({t:"home"});}} style={{fontFamily:"var(--s)",fontSize:13,fontWeight:700,color:P.goldLight,cursor:"pointer",letterSpacing:"0.08em"}}>M'BARI</span>
          <span style={{fontSize:8,color:"rgba(255,255,255,0.18)",fontStyle:"italic"}}>Where culture lives</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",fontSize:11}}>
          <span onClick={()=>nav("submit")} style={{color:P.navText,cursor:"pointer"}}>Submit</span>
          <span onClick={()=>nav("events")} style={{color:P.navText,cursor:"pointer"}}>Events</span>
          <span style={{color:P.navText,cursor:"pointer"}}>Critics</span>
          {user&&<span onClick={()=>nav("admin")} style={{color:P.goldLight,cursor:"pointer",fontSize:10}}>Admin</span>}
          {user?<span style={{color:P.goldLight,fontWeight:600,fontSize:10}}>{user.name}</span>:(
            <button onClick={()=>setAuth(true)} style={{padding:"2px 8px",borderRadius:2,border:"1px solid rgba(196,168,98,0.2)",background:"none",color:P.goldLight,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"}}>Sign in</button>
          )}
        </div>
      </div>
    </nav>

    {auth&&<AuthModal onClose={()=>setAuth(false)} onLogin={p=>{setUser({name:"Guest"});setAuth(false);}}/>}

    <div style={{paddingTop:34}}>
      {pg.t==="home"&&<Home nav={nav}/>}
      {pg.t==="film"&&<ScrollFilmPage filmId={pg.id} nav={nav} back={back}/>}
      {pg.t==="director"&&<CrewPage crewId={pg.id} nav={nav} back={back}/>}
      {pg.t==="language"&&<LangPage code={pg.id} nav={nav} back={back}/>}
      {pg.t==="event"&&<EventPage eventId={pg.id} nav={nav} back={back}/>}
      {pg.t==="events"&&<div style={{maxWidth:860,margin:"0 auto",padding:"24px 20px 40px"}}>
        <button onClick={back} style={{background:"none",border:`1px solid ${P.border}`,color:P.inkMuted,padding:"4px 12px",borderRadius:2,cursor:"pointer",fontSize:11,marginBottom:16,fontFamily:"var(--b)"}}>← Back</button>
        <div style={{borderTop:`3px solid ${P.ink}`,paddingTop:6,marginBottom:16}}><h1 style={{fontFamily:"var(--s)",fontSize:24,fontWeight:700,color:P.ink,margin:0}}>Live and events</h1></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:12}}>
          {EVENTS.map(ev=><div key={ev.id} onClick={()=>nav("event",ev.id)} style={{cursor:"pointer",border:`1px solid ${P.border}`,background:P.white}}>
            <div style={{position:"relative",height:120,overflow:"hidden"}}><img src={ev.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              {ev.live&&<span style={{position:"absolute",top:8,left:8,display:"inline-flex",alignItems:"center",gap:3,fontSize:8,fontWeight:700,color:"#fff",padding:"2px 8px",background:P.green}}><span style={{width:5,height:5,borderRadius:"50%",background:"#fff",animation:"livepulse 1.5s ease infinite"}}/>LIVE</span>}
            </div>
            <div style={{padding:"10px 12px"}}><div style={{fontSize:8,color:P.gold,letterSpacing:"0.08em",fontWeight:600}}>{ev.type}</div><div style={{fontFamily:"var(--s)",fontWeight:700,fontSize:14,color:P.ink}}>{ev.title}</div><div style={{fontSize:10,color:P.inkFaint}}>{ev.venue} · {ev.date}</div></div>
          </div>)}
        </div>
      </div>}
      {pg.t==="admin"&&<AdminPage nav={nav} back={back}/>}
      {pg.t==="submit"&&<SubmitPage back={back}/>}
    </div>

    <footer style={{borderTop:`1px solid ${P.border}`,maxWidth:1060,margin:"0 auto",padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
      <div><div style={{fontFamily:"var(--s)",fontSize:13,fontWeight:700,color:P.ink,letterSpacing:"0.06em"}}>M'Bari</div><div style={{fontSize:9,color:P.inkFaint,fontStyle:"italic"}}>Where culture lives</div></div>
      <div style={{fontSize:9,color:P.inkFaint}}>© 2026 M'Bari · Methodology · Critics · API · Privacy</div>
    </footer>
  </div>);
}
