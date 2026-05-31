/* ============================================================================
   Blink Icon System  —  faithful web port of the app's <IconSymbol>
   Source: Safwa9amar/blink · components/ui/icon-symbol.tsx
   ----------------------------------------------------------------------------
   The app names icons with Apple SF Symbol strings and maps them to
   @expo/vector-icons families — Material Icons (default) for ~95%, plus a few
   FontAwesome5 (socials/globe) and FontAwesome/Entypo. iOS renders native SF
   Symbols; Android + web fall back to Material Icons. This file reproduces that
   fallback on the web so artifacts use the EXACT same icon vocabulary.

   Usage:
     <script src="blink-icons.js"></script>              (loads the fonts too)
     <blink-icon name="house.fill"></blink-icon>
     <blink-icon name="cart.fill" size="20" color="#EE335F"></blink-icon>
     <blink-icon name="tiktok"></blink-icon>             (FontAwesome brand)

   Programmatic:  BlinkIcons.svgMap['house.fill'] -> { lib, name }
   ========================================================================== */
(function () {
  // SF-Symbol name  ->  material-icons name (string)  OR  { lib, name }
  // Verbatim from the repo MAPPING.
  const MAP = {
    "house.fill":"home","house":"home","paperplane.fill":"send",
    "chevron.left.forwardslash.chevron.right":"code","chevron.left":"chevron-left",
    "chevron.right":"chevron-right","chevron.down":"keyboard-arrow-down","chevron.up":"keyboard-arrow-up",
    "cart.fill":"shopping-cart","list.bullet.clipboard.fill":"assignment","gift.fill":"card-giftcard",
    "person.fill":"person","person.2.fill":"person","person.circle":"account-circle",
    "person.crop.circle":"account-circle","person.badge.plus":"person-add",
    "location.fill":"location-on","location":"location-on","location.north.fill":"navigation",
    "location.circle.fill":"my-location","bell.fill":"notifications","bell":"notifications-none",
    "shippingbox.fill":"local-shipping","truck.fill":"local-shipping","box.truck.fill":"add-box",
    "bag.fill":"shopping-bag","bolt.fill":"bolt","creditcard.fill":"credit-card",
    "checkmark.shield.fill":"gpp-good","tag":"local-offer","tag.fill":"local-offer",
    "ticket.fill":"local-offer","clock":"schedule","clock.fill":"schedule",
    "gear.shape.fill":"settings","gearshape.fill":"settings","heart.fill":"favorite","heart":"favorite-border",
    "map.fill":"map","map":"map","chart.bar.fill":"bar-chart","arrow.triangle.2.circlepath":"sync",
    "arrow.clockwise":"sync","hand.thumbsup.fill":"thumb-up","hand.raised.fill":"handshake",
    "moon.fill":"dark-mode","lifebuoy.fill":"support","camera.fill":"camera",
    "info.circle":"info","info.circle.fill":"info","checkmark.circle":"check-circle",
    "checkmark.circle.fill":"check-circle","checkmark.seal.fill":"verified","checkmark":"check",
    "exclamationmark.triangle":"warning","exclamationmark.triangle.fill":"warning",
    "exclamationmark.circle.fill":"error","exclamationmark.square.fill":"report",
    "xmark.circle":"cancel","xmark.circle.fill":"cancel","xmark":"close",
    "star.fill":"star","star":"star-border","envelope.fill":"email","phone.fill":"smartphone",
    "phone":"phone","phone.circle.fill":"phone","birthday.cake.fill":"cake",
    "circle":"radio-button-unchecked","circle.fill":"circle","largecircle.fill.circle":"radio-button-checked",
    "mappin.and.ellipse":"location-on","mappin.circle.fill":"place","mappin.circle":"place",
    "mappin.fill":"location-on","mappin":"location-on","briefcase.fill":"work",
    "storefront.fill":"storefront","questionmark.circle":"help-outline","questionmark.circle.fill":"help",
    "eye.fill":"visibility","eye":"visibility","eye.slash.fill":"visibility-off",
    "rectangle.portrait.and.arrow.right":"logout","trash":"delete","trash.fill":"delete",
    "lock.fill":"lock","shield.fill":"security","minus":"remove","plus":"add",
    "plus.circle":"add-circle-outline","plus.circle.fill":"add-circle","bicycle":"directions-bike",
    "headphones":"headset","bookmark.fill":"bookmark","arrow.right":"arrow-forward",
    "arrow.left":"arrow-back","arrow.up.right":"north-east",
    "arrow.triangle.turn.up.right.diamond.fill":"directions","directions":"directions",
    "mic.fill":"mic","scope":"my-location","ellipsis":"more-horiz","doc.text.fill":"description",
    "doc.text":"article","doc.fill":"insert-drive-file","doc.badge.plus":"note-add",
    "doc.on.doc.fill":"content-copy","square.on.square":"content-copy","magnifyingglass":"search",
    "bubble.left.fill":"chat","banknote":"payments","banknote.fill":"payments",
    "dollarsign.circle.fill":"monetization-on","slider.horizontal.3":"filter-list-alt",
    "line.3.horizontal.decrease":"filter-list","square.and.arrow.up":"share","fork.knife":"restaurant",
    "croissant.fill":"bakery-dining","sparkles":"auto-awesome","arrow.up.doc.fill":"file-upload",
    "square.grid.2x2.fill":"grid-view","text":"description","tshirt.fill":"checkroom",
    "desktopcomputer":"computer","car.fill":"directions-car","car":"directions-car",
    "scooter":"electric-scooter","trophy.fill":"emoji-events","photo.fill":"photo",
    "text.badge.minus":"indeterminate-check-box","calendar":"calendar-today",
    "line.3.horizontal":"reorder","pencil":"edit","newspaper.fill":"newspaper",
    "megaphone.fill":"campaign","link":"link","wallet.pass.fill":"account-balance-wallet",
    "wallet.pass":"account-balance-wallet","wallet.bifold.fill":"account-balance-wallet",
    "motorcycle":"motorcycle","rectangle.fill.badge.checkmark":"badge","paperclip":"attach-file",
    "building.columns.fill":"account-balance","medical.kit.fill":"medical-services",
    "flag.fill":"flag","qrcode":"qr-code-2",
    // non-Material families:
    "globe":{lib:"fa",name:"globe"},
    "facebook":{lib:"fab",name:"facebook"},"instagram":{lib:"fab",name:"instagram"},
    "twitter":{lib:"fab",name:"twitter"},"tiktok":{lib:"fab",name:"tiktok"},
    "FontAwesome5.store.slash":{lib:"fa",name:"store-slash"},
    "fontAwesome.copy":{lib:"fa",name:"copy"},"entypo.box":"add-box"
  };

  // FontAwesome unicode glyphs (FA6 free) for the few brand/solid icons used.
  const FA = {
    globe:{u:"\uf0ac",b:false}, "store-slash":{u:"\uf3ed",b:false}, copy:{u:"\uf0c5",b:false},
    facebook:{u:"\uf09a",b:true}, instagram:{u:"\uf16d",b:true}, twitter:{u:"\uf099",b:true}, tiktok:{u:"\ue07b",b:true}
  };

  function ligature(materialName){ return materialName.replace(/-/g,"_"); }

  // inject font links once
  function ensureFonts(){
    if (document.getElementById("blink-icon-fonts")) return;
    const l1 = document.createElement("link");
    l1.id = "blink-icon-fonts"; l1.rel = "stylesheet";
    l1.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    document.head.appendChild(l1);
    const l2 = document.createElement("link");
    l2.rel = "stylesheet";
    l2.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
    document.head.appendChild(l2);
    const st = document.createElement("style");
    st.textContent = `blink-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1;vertical-align:middle}
      blink-icon .material-icons{font-family:'Material Icons';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:'liga';-webkit-font-feature-settings:'liga'}
      blink-icon .fa-ic{font-family:'Font Awesome 6 Free';font-weight:900}
      blink-icon .fa-ic.brand{font-family:'Font Awesome 6 Brands';font-weight:400}`;
    document.head.appendChild(st);
  }

  function render(el){
    const name = el.getAttribute("name");
    const size = el.getAttribute("size") || 24;
    const color = el.getAttribute("color") || "currentColor";
    el.style.fontSize = size + "px";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.color = color;
    let cfg = MAP[name];
    if (cfg === undefined) cfg = "help-outline"; // app's fallback
    if (typeof cfg === "string") {
      el.innerHTML = `<span class="material-icons" style="font-size:inherit">${ligature(cfg)}</span>`;
    } else if (cfg.lib === "fab" || cfg.lib === "fa") {
      const g = FA[cfg.name];
      el.innerHTML = `<span class="fa-ic ${cfg.lib==='fab'?'brand':''}" style="font-size:inherit">${g?g.u:""}</span>`;
    }
  }

  class BlinkIcon extends HTMLElement {
    static get observedAttributes(){ return ["name","size","color"]; }
    connectedCallback(){ ensureFonts(); render(this); }
    attributeChangedCallback(){ if (this.isConnected) render(this); }
  }
  if (!customElements.get("blink-icon")) customElements.define("blink-icon", BlinkIcon);

  window.BlinkIcons = { svgMap: MAP, fa: FA, ligature, ensureFonts };
})();
