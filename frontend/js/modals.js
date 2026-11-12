// ---- MODALS ----
const MODAL_FORMS = {
  company: {
    title: (id)=> id ? 'Edit Account' : 'Create Account',
    fullPage: true,
    fpModule: 'accounts',
    fields: (r={},id) => `
      <!-- Account Image -->
      <div class="lf-section-title">Account Image</div>
      <div style="margin-bottom:24px">
        <div style="width:64px;height:64px;border:2px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--fg3)" title="Upload account image">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
        </div>
      </div>

      <!-- Account Information -->
      <div class="lf-section-title">Account Information</div>
      <div class="lf-grid">
        <div class="lf-field"><label>BD Owner</label>${ownerField('bdOwner', r.bdOwner||r.owner, !!id)}</div>
        <div class="lf-field"><label>Rating</label><select id="f-rating"><option value="">-None-</option>${['Hot','Warm','Cold'].map(s=>`<option ${r.rating===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Account Name *</label><input id="f-name" type="text" value="${r.name||''}" style="border-color:${r.name?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Phone</label><input id="f-phone" type="tel" value="${r.phone||''}" oninput="this.value=this.value.replace(/[^0-9+\\-() ]/g,'')"></div>
        <div class="lf-field"><label>Account Site</label><input id="f-accountSite" type="text" value="${r.accountSite||''}"></div>
        <div class="lf-field"><label>Fax</label><input id="f-fax" type="tel" value="${r.fax||''}"></div>
        <div class="lf-field"><label>Parent Account</label><input id="f-parentAccount" type="text" value="${r.parentAccount||''}"></div>
        <div class="lf-field"><label>Website</label><input id="f-website" type="url" placeholder="https://" value="${r.website||''}"></div>
        <div class="lf-field"><label>Account Number</label><input id="f-accountNumber" type="text" value="${r.accountNumber||''}"></div>
        <div class="lf-field"><label>Ticker Symbol</label><input id="f-tickerSymbol" type="text" value="${r.tickerSymbol||''}"></div>
        <div class="lf-field"><label>Account Type</label><select id="f-accountType"><option value="">-None-</option>${['Analyst','Competitor','Customer','Distributor','Integrator','Investor','Partner','Press','Prospect','Reseller','Other'].map(s=>`<option ${r.accountType===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Ownership</label><select id="f-ownership"><option value="">-None-</option>${['Public','Private','Subsidiary','Other'].map(s=>`<option ${r.ownership===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Industry</label><select id="f-industry"><option value="">-None-</option>${['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Real Estate','Media','Consulting','Other'].map(s=>`<option ${r.industry===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Employees</label><input id="f-employees" type="number" min="0" value="${r.employees||''}"></div>
        <div class="lf-field"><label>Annual Revenue</label><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;color:var(--fg2);white-space:nowrap">Rs.</span><input id="f-annualRevenue" type="number" min="0" style="flex:1" value="${r.annualRevenue||''}"></div></div>
        <div class="lf-field"><label>SIC Code</label><input id="f-sicCode" type="text" value="${r.sicCode||''}"></div>
        <div class="lf-field"><label>Delivery Pillar</label><select id="f-deliveryPillar"><option value="">-None-</option>${['Samyadeep','Vikram'].map(s=>`<option ${(r.deliveryPillar||r.delivery_pillar)===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>

      <!-- Address Information -->
      <div class="lf-section-title" style="margin-top:32px;display:flex;align-items:center;justify-content:space-between">
        <span>Address Information</span>
        <button type="button" onclick="copyBillingToShipping()" class="btn btn-secondary btn-sm">Copy Address</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="lf-addr-box">
          <div class="lf-addr-label">Billing Address</div>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start;margin-top:8px">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Country / Region</label>
            <select id="f-billingCountry"><option value="">-None-</option>${['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','Other'].map(s=>`<option ${r.billingCountry===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Flat / House No. / Building / Apartment Name</label>
            <input id="f-billingFlat" type="text" value="${r.billingFlat||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Street Address</label>
            <input id="f-billingStreet" type="text" value="${r.billingStreet||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">City</label>
            <input id="f-billingCity" type="text" value="${r.billingCity||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">State / Province</label>
            <select id="f-billingState"><option value="">-None-</option>${['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat','West Bengal','Uttar Pradesh','Rajasthan','Punjab','Other'].map(s=>`<option ${r.billingState===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Zip / Postal Code</label>
            <input id="f-billingZip" type="text" value="${r.billingZip||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Coordinates</label>
            <div style="display:flex;gap:6px"><input id="f-billingLat" type="text" placeholder="Latitude" value="${r.billingLat||''}"><input id="f-billingLng" type="text" placeholder="Longitude" value="${r.billingLng||''}"></div>
            <div></div><div style="text-align:right"><button type="button" onclick="clearBillingAddr()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--fg3)">Clear All</button></div>
          </div>
        </div>
        <div class="lf-addr-box">
          <div class="lf-addr-label">Shipping Address</div>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--accent);cursor:pointer;margin:6px 0 4px 0;padding:4px 10px;background:var(--accent)15;border-radius:6px;border:1px solid var(--accent)40">
            <input type="checkbox" id="f-sameAsBilling" onchange="if(this.checked)copyBillingToShipping()" style="cursor:pointer;accent-color:var(--accent)">
            ✓ Same as Billing Address
          </label>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start;margin-top:8px">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Country / Region</label>
            <select id="f-shippingCountry"><option value="">-None-</option>${['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','Other'].map(s=>`<option ${r.shippingCountry===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Flat / House No. / Building / Apartment Name</label>
            <input id="f-shippingFlat" type="text" value="${r.shippingFlat||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Street Address</label>
            <input id="f-shippingStreet" type="text" value="${r.shippingStreet||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">City</label>
            <input id="f-shippingCity" type="text" value="${r.shippingCity||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">State / Province</label>
            <select id="f-shippingState"><option value="">-None-</option>${['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat','West Bengal','Uttar Pradesh','Rajasthan','Punjab','Other'].map(s=>`<option ${r.shippingState===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Zip / Postal Code</label>
            <input id="f-shippingZip" type="text" value="${r.shippingZip||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Coordinates</label>
            <div style="display:flex;gap:6px"><input id="f-shippingLat" type="text" placeholder="Latitude" value="${r.shippingLat||''}"><input id="f-shippingLng" type="text" placeholder="Longitude" value="${r.shippingLng||''}"></div>
            <div></div><div style="text-align:right"><button type="button" onclick="clearShippingAddr()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--fg3)">Clear All</button></div>
          </div>
        </div>
      </div>

      <!-- Description Information -->
      <div class="lf-section-title" style="margin-top:32px">Description Information</div>
      <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start">
        <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Description</label>
        <textarea id="f-description" rows="4">${r.description||''}</textarea>
      </div>`,
    save: async (id) => {
      const existing = id ? (DB.companies.find(c=>c.id===id)||{}) : {};
      const prevDeliveryPillar = existing.deliveryPillar || existing.delivery_pillar || '';
      const r = {
        name:v('name'), bdOwner:v('bdOwner'),
        status: existing.status || 'Active',
        phone:v('phone'), fax:v('fax'), accountSite:v('accountSite'),
        website:v('website'), parentAccount:v('parentAccount'),
        accountNumber:v('accountNumber'), tickerSymbol:v('tickerSymbol'),
        accountType:v('accountType'), ownership:v('ownership'),
        industry:v('industry'), employees:Number(v('employees')||0),
        annualRevenue:Number(v('annualRevenue')||0), sicCode:v('sicCode'),
        deliveryPillar:v('deliveryPillar'),
        billingCountry:v('billingCountry'), billingFlat:v('billingFlat'),
        billingStreet:v('billingStreet'), billingCity:v('billingCity'),
        billingState:v('billingState'), billingZip:v('billingZip'),
        billingLat:v('billingLat'), billingLng:v('billingLng'),
        shippingCountry:v('shippingCountry'), shippingFlat:v('shippingFlat'),
        shippingStreet:v('shippingStreet'), shippingCity:v('shippingCity'),
        shippingState:v('shippingState'), shippingZip:v('shippingZip'),
        shippingLat:v('shippingLat'), shippingLng:v('shippingLng'),
        // also map to simple city/state/country for trigger compatibility
        city:v('billingCity'), state:v('billingState'), country:v('billingCountry'),
        description:v('description')
      };
      if (!r.name) return alert('Account Name required');
      upsert('companies', id, r);
      // Notify delivery pillar if newly assigned or changed
      const newPillar = r.deliveryPillar;
      if (newPillar && newPillar !== prevDeliveryPillar) {
        showToast(`📬 ${newPillar} has been notified as Delivery Pillar for ${r.name}`, 'success');
        // Log an activity as notification record
        const notifActivity = {
          type: 'Email', subject: `Delivery Pillar Assignment: ${r.name}`,
          summary: `${newPillar} assigned as Delivery Pillar for account "${r.name}". Please ensure smooth delivery handover.`,
          date: new Date().toISOString().slice(0,10), owner: newPillar,
          company: r.name
        };
        try {
          await DB_CLIENT.from('activities').insert([snakeCaseKeys(notifActivity, SUPA_COLS.activities)]);
        } catch(e) { console.warn('Notification activity insert failed', e); }
      }
    }
  },
  contact: {
    title: (id)=> id ? 'Edit Contact' : 'Create Contact',
    fullPage: true,
    fpModule: 'contacts',
    fields: (r={},id) => `
      <!-- Contact Information -->
      <div class="lf-section-title">Contact Information</div>
      <div class="lf-grid">
        <div class="lf-field"><label>Contact Owner</label>${ownerField('owner', r.owner, !!id)}</div>
        <div class="lf-field"><label>Lead Source</label><select id="f-leadSource"><option value="">-None-</option>${['Cold Call','Email','Existing Client','Partner','Public Relations','Direct Mail','Conference','Trade Show','Web Site','Internal Seminar','Employees','Word of Mouth','Other'].map(s=>`<option ${r.leadSource===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>First Name</label><div style="display:flex;gap:6px"><select id="f-salutation" style="width:90px;flex-shrink:0"><option value="">-None-</option>${['Mr.','Ms.','Mrs.','Dr.','Prof.'].map(s=>`<option ${r.salutation===s?'selected':''}>${s}</option>`).join('')}</select><input id="f-firstName" type="text" value="${r.firstName||''}"></div></div>
        <div class="lf-field"><label>Last Name *</label><input id="f-lastName" type="text" value="${r.lastName||r.name||''}" style="border-color:${r.lastName||r.name?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Account Name</label><input id="f-companyName" type="text" value="${r.companyName||getCompanyName(r.companyId)||''}"></div>
        <div class="lf-field"><label>Vendor Name</label><input id="f-vendorName" type="text" value="${r.vendorName||''}"></div>
        <div class="lf-field"><label>Email</label><input id="f-email" type="email" value="${r.email||''}"></div>
        <div class="lf-field"><label>Title</label><input id="f-title" type="text" value="${r.title||''}"></div>
        <div class="lf-field"><label>Phone</label><input id="f-phone" type="tel" value="${r.phone||''}" oninput="this.value=this.value.replace(/[^0-9+\\-() ]/g,'')"></div>
        <div class="lf-field"><label>Department</label><input id="f-department" type="text" value="${r.department||''}"></div>
        <div class="lf-field"><label>Other Phone</label><input id="f-otherPhone" type="tel" value="${r.otherPhone||''}"></div>
        <div class="lf-field"><label>Home Phone</label><input id="f-homePhone" type="tel" value="${r.homePhone||''}"></div>
        <div class="lf-field"><label>Mobile</label><input id="f-mobile" type="tel" value="${r.mobile||''}"></div>
        <div class="lf-field"><label>Fax</label><input id="f-fax" type="tel" value="${r.fax||''}"></div>
        <div class="lf-field"><label>Assistant</label><input id="f-assistant" type="text" value="${r.assistant||''}"></div>
        <div class="lf-field"><label>Date of Birth</label><input id="f-dob" type="date" placeholder="DD/MM/YYYY" value="${r.dob||''}"></div>
        <div class="lf-field"></div>
        <div class="lf-field"><label>Asst Phone</label><input id="f-asstPhone" type="tel" value="${r.asstPhone||''}"></div>
        <div class="lf-field"></div>
        <div class="lf-field" style="display:flex;align-items:center;gap:8px;padding-top:4px"><label style="text-align:right;padding-right:12px">Email Opt Out</label><input type="checkbox" id="f-emailOptOut" ${r.emailOptOut?'checked':''} style="accent-color:var(--accent);width:15px;height:15px;flex-shrink:0;margin:0"></div>
        <div class="lf-field"><label>Secondary Email</label><input id="f-email2" type="email" value="${r.email2||''}"></div>
        <div class="lf-field"><label>Reporting To</label><input id="f-reportingTo" type="text" value="${r.reportingTo||''}"></div>
      </div>

      <!-- Address Information -->
      <div class="lf-section-title" style="margin-top:32px;display:flex;align-items:center;justify-content:space-between">
        <span>Address Information</span>
        <button type="button" onclick="copyMailingToOther()" class="btn btn-secondary btn-sm">Copy Address</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="lf-addr-box">
          <div class="lf-addr-label">Mailing Address</div>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start;margin-top:8px">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Country / Region</label>
            <select id="f-country"><option value="">-None-</option>${['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','Other'].map(s=>`<option ${r.country===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Flat / House No. / Building / Apartment Name</label>
            <input id="f-addrLine1" type="text" value="${r.addrLine1||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Street Address</label>
            <input id="f-street" type="text" value="${r.street||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">City</label>
            <input id="f-city" type="text" value="${r.city||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">State / Province</label>
            <select id="f-state"><option value="">-None-</option>${['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat','West Bengal','Uttar Pradesh','Rajasthan','Punjab','Other'].map(s=>`<option ${r.state===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Zip / Postal Code</label>
            <input id="f-zip" type="text" value="${r.zip||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Coordinates</label>
            <div style="display:flex;gap:6px"><input id="f-lat" type="text" placeholder="Latitude" value="${r.lat||''}"><input id="f-lng" type="text" placeholder="Longitude" value="${r.lng||''}"></div>
            <div></div><div style="text-align:right"><button type="button" onclick="clearMailingAddr()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--fg3)">Clear All</button></div>
          </div>
        </div>
        <div class="lf-addr-box">
          <div class="lf-addr-label">Other Address</div>
          <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start;margin-top:8px">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Country / Region</label>
            <select id="f-country2"><option value="">-None-</option>${['India','USA','UK','UAE','Singapore','Canada','Australia','Germany','Other'].map(s=>`<option ${r.country2===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Flat / House No. / Building / Apartment Name</label>
            <input id="f-addrLine2" type="text" value="${r.addrLine2||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Street Address</label>
            <input id="f-street2" type="text" value="${r.street2||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">City</label>
            <input id="f-city2" type="text" value="${r.city2||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">State / Province</label>
            <select id="f-state2"><option value="">-None-</option>${['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat','West Bengal','Uttar Pradesh','Rajasthan','Punjab','Other'].map(s=>`<option ${r.state2===s?'selected':''}>${s}</option>`).join('')}</select>
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Zip / Postal Code</label>
            <input id="f-zip2" type="text" value="${r.zip2||''}">
            <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Coordinates</label>
            <div style="display:flex;gap:6px"><input id="f-lat2" type="text" placeholder="Latitude" value="${r.lat2||''}"><input id="f-lng2" type="text" placeholder="Longitude" value="${r.lng2||''}"></div>
            <div></div><div style="text-align:right"><button type="button" onclick="clearOtherAddr()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--fg3)">Clear All</button></div>
          </div>
        </div>
      </div>

      <!-- Description Information -->
      <div class="lf-section-title" style="margin-top:32px">Description Information</div>
      <div style="display:grid;grid-template-columns:160px 1fr;gap:10px 8px;align-items:start">
        <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Description</label>
        <textarea id="f-description" rows="4">${r.description||''}</textarea>
      </div>`,
    save: (id) => {
      const cb = (fid) => document.getElementById('f-'+fid)?.checked || false;
      const firstName = v('firstName'), lastName = v('lastName');
      const fullName = [v('salutation'), firstName, lastName].filter(Boolean).join(' ') || lastName;
      if (!lastName) return alert('Last Name required');
      const r = {
        name: fullName, firstName, lastName, salutation:v('salutation'),
        owner:v('owner'), leadSource:v('leadSource'),
        companyName:v('companyName'), vendorName:v('vendorName'),
        email:v('email'), email2:v('email2'), title:v('title'),
        phone:v('phone'), department:v('department'),
        otherPhone:v('otherPhone'), homePhone:v('homePhone'),
        mobile:v('mobile'), fax:v('fax'),
        assistant:v('assistant'), asstPhone:v('asstPhone'),
        dob:v('dob'), skype:v('skype'), twitter:v('twitter'),
        reportingTo:v('reportingTo'), emailOptOut:cb('emailOptOut'),
        country:v('country'), addrLine1:v('addrLine1'), street:v('street'),
        city:v('city'), state:v('state'), zip:v('zip'), lat:v('lat'), lng:v('lng'),
        country2:v('country2'), addrLine2:v('addrLine2'), street2:v('street2'),
        city2:v('city2'), state2:v('state2'), zip2:v('zip2'), lat2:v('lat2'), lng2:v('lng2'),
        description:v('description')
      };
      upsert('contacts', id, r);
    }
  },
  lead: {
    title: (id)=> id ? 'Edit Lead' : 'Create Lead',
    fullPage: true,
    fields: (r={},id) => `
      <!-- Lead Information -->
      <div class="lf-section-title">Lead Information</div>
      <div class="lf-avatar-row"><div class="lf-avatar-placeholder">👤</div></div>
      <div class="lf-grid">
        <div class="lf-field"><label>Lead Owner</label>${ownerField('owner', r.owner, !!id)}</div>
        <div class="lf-field"><label>Company *</label><input id="f-companyName" type="text" value="${r.companyName||getCompanyName(r.companyId)||''}" style="border-color:${r.companyName||getCompanyName(r.companyId)?'':'var(--red)'}"></div>
        <div class="lf-field"><label>First Name</label><div style="display:flex;gap:6px"><select id="f-salutation" style="width:90px;flex-shrink:0"><option value="">-None-</option>${['Mr.','Ms.','Mrs.','Dr.','Prof.'].map(s=>`<option ${r.salutation===s?'selected':''}>${s}</option>`).join('')}</select><input id="f-firstName" type="text" value="${r.firstName||''}"></div></div>
        <div class="lf-field"><label>Last Name *</label><input id="f-lastName" type="text" value="${r.lastName||''}" style="border-color:${r.lastName?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Title / Designation</label><input id="f-title" type="text" value="${r.title||''}"></div>
        <div class="lf-field"><label>Email *</label><input id="f-email" type="email" required value="${r.email||''}" style="border-color:${r.email?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Phone *</label><input id="f-phone" type="tel" required value="${r.phone||''}" oninput="this.value=this.value.replace(/[^0-9+\\-() ]/g,'')" style="border-color:${r.phone?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Website</label><input id="f-website" type="text" value="${r.website||''}"></div>
        <div class="lf-field"><label>Lead Source</label><select id="f-source"><option value="">-None-</option>${['Cold Call','Email','Existing Client','Partner','Public Relations','Direct Mail','Conference','Trade Show','Web Site','Internal Seminar','Employees','Google AdWords','LinkedIn','Marketing','Word of Mouth','Other'].map(s=>`<option ${r.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Lead Status</label><select id="f-stage"><option value="">-None-</option>${LEAD_STAGES.map(s=>`<option ${r.stage===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Lead Type</label><select id="f-leadType"><option value="">-None-</option>${['Inbound','Outbound'].map(s=>`<option ${r.leadType===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Lead Category</label><select id="f-leadCategory"><option value="">-None-</option>${['Hot','Warm','Cold'].map(s=>`<option ${(r.leadCategory||r.lead_category)===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Industry</label><select id="f-industry"><option value="">-None-</option>${['IT Services','Banking & Finance','E-Commerce','Mobility Tech','Healthcare','Manufacturing','Retail','Media','Education','Real Estate','Other'].map(s=>`<option ${r.industry===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>No. of Employees</label><input id="f-numEmployees" type="number" value="${r.numEmployees||''}"></div>
        <div class="lf-field"><label>Secondary Email</label><input id="f-email2" type="email" value="${r.email2||''}"></div>
        <div class="lf-field"><label>Date of Handover</label><input id="f-handoverDate" type="date" value="${r.handoverDate||''}"></div>
        <div class="lf-field"><label>Lane / Domain</label><select id="f-lane"><option value="">-None-</option>${['SaaS','AI','Healthtech','Logistics','Fintech','Ed Tech','Agri Tech','Travel Tech','Enterprise','E-commerce'].map(s=>`<option ${r.lane===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Source – Sales / Delivery</label><select id="f-sourceSD"><option value="">-None-</option>${['Sales','Delivery'].map(s=>`<option ${r.sourceSD===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-checkbox"><label>Email Opt Out</label><input type="checkbox" id="f-emailOptOut" ${r.emailOptOut?'checked':''}></div>
        <div class="lf-checkbox"><label>Handover Done</label><input type="checkbox" id="f-handoverDone" ${r.handoverDone?'checked':''}></div>
        <div class="lf-field"><label>Client Type</label><select id="f-clientType"><option value="">-None-</option>${['New','Farming','Retention','Renew'].map(s=>`<option ${r.clientType===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>

      <!-- Follow Up Section -->
      <div class="lf-section-title" style="margin-top:28px">Follow Up</div>
      <div class="lf-grid">
        <div class="lf-field"><label>Follow-up Date</label><input id="f-followupDate2" type="date" value="${r.followupDate||''}"></div>
        <div class="lf-field"><label>Follow-up Status</label><select id="f-followupStatus"><option value="">-None-</option>${['Pending','Done','Rescheduled','No Response'].map(s=>`<option ${r.followupStatus===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field lf-full"><label>Follow-up Notes</label><textarea id="f-followupNotes" rows="3" placeholder="Notes about next follow up…">${r.followupNotes||''}</textarea></div>
      </div>

      <!-- Description Information -->
      <div class="lf-section-title" style="margin-top:28px">Description / Activity Log</div>
      <div class="lf-grid">
        <div class="lf-field lf-full">
          <label>Activity Log</label>
          <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">
            <div id="desc-log" style="max-height:260px;overflow-y:auto;padding:0;border-bottom:1px solid var(--border)"></div>
            <div style="display:flex;gap:8px;padding:8px 10px;background:var(--surface2);align-items:center">
              <input id="f-desc-input" type="text" placeholder="Add a note and press Enter or click Add…" style="flex:1;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;background:var(--surface);color:var(--fg)" onkeydown="if(event.key==='Enter'){event.preventDefault();addDescEntry();}">
              <button type="button" onclick="addDescEntry()" style="padding:6px 14px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer">Add</button>
            </div>
          </div>
          <input type="hidden" id="f-description" value="${(r.description||'').replace(/"/g,'&quot;')}">
        </div>
      </div>`,
    save: (id) => {
      const cb = (fid) => document.getElementById('f-'+fid)?.checked || false;
      const r = {
        owner:v('owner'), stage:v('stage'), salutation:v('salutation'),
        firstName:v('firstName'), lastName:v('lastName'), title:v('title'),
        companyName:v('companyName'),
        email:v('email'), email2:v('email2'), phone:v('phone'),
        website:v('website'),
        source:v('source'), industry:v('industry'),
        leadCategory:v('leadCategory'),
        leadType:v('leadType'),
        numEmployees:Number(v('numEmployees')||0),
        value:Number(v('value')||0), lane:v('lane'), sourceSD:v('sourceSD'),
        handoverDate:v('handoverDate'), followupDate:v('followupDate2')||v('followupDate'),
        followupStatus:v('followupStatus'), followupNotes:v('followupNotes'),
        clientType:v('clientType'),
        country:v('country'), addrLine1:v('addrLine1'), street:v('street'),
        city:v('city'), state:v('state'), zip:v('zip'), lat:v('lat'), lng:v('lng'),
        description:v('description'),
        handoverDone:cb('handoverDone'), emailOptOut:cb('emailOptOut')
      };
      r.name = [r.salutation, r.firstName, r.lastName].filter(Boolean).join(' ') || r.clientName;
      if (!r.lastName && !r.clientName) return alert('Last Name or Client Name required');
      if (!r.email) return alert('Email is required');
      if (!r.phone) return alert('Phone is required');
      upsert('leads', id, r);
    }
  },
  deal: {
    title: (id)=> id ? 'Edit Deal' : 'Create Deal',
    fullPage: true,
    fpModule: 'deals',
    fields: (r={},id) => `
      <!-- Deal Information -->
      <div class="lf-section-title">Deal Information</div>
      <div class="lf-grid">
        <div class="lf-field"><label>Deal Owner</label>${ownerField('owner', r.owner, !!id)}</div>
        <div class="lf-field"><label>Amount</label><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;color:var(--fg2);white-space:nowrap">Rs.</span><input id="f-amount" type="number" style="flex:1" value="${r.amount||''}" oninput="calcExpectedRevenue()"></div></div>
        <div class="lf-field"><label>Deal Name *</label><input id="f-name" type="text" value="${r.name||''}"></div>
        <div class="lf-field"><label>Closing Date</label><input id="f-closeDate" type="date" placeholder="DD/MM/YYYY" value="${r.closeDate||''}"></div>
        <div class="lf-field"><label>Company / Account *</label><input id="f-companyName" type="text" placeholder="Company name" value="${r.companyName||''}" style="border-color:${r.companyName?'':'var(--red)'}"></div>
        <div class="lf-field"><label>Stage</label><select id="f-stage">${DEAL_STAGES.map(s=>`<option ${r.stage===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Type</label><select id="f-dealType"><option value="">-None-</option>${['New Business','Existing Business – Renewal','Existing Business – Upgrade','Existing Business – Downgrade'].map(s=>`<option ${r.dealType===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Probability (%)</label><input id="f-probability" type="number" min="0" max="100" step="0.1" value="${r.probability!==undefined?r.probability:10}" oninput="calcExpectedRevenue()"></div>
        <div class="lf-field"><label>Next Step</label><input id="f-nextStep" type="text" value="${r.nextStep||''}"></div>
        <div class="lf-field"><label>Expected Revenue <span style="font-size:10px;color:var(--fg3)">(auto)</span></label><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;color:var(--fg2);white-space:nowrap">Rs.</span><input id="f-expectedRevenue" type="number" style="flex:1;background:var(--surface2)" readonly value="${r.expectedRevenue||Math.round((r.amount||0)*(r.probability||10)/100)||''}"></div></div>
        <div class="lf-field"><label>Lead Source</label><select id="f-source"><option value="">-None-</option>${['Cold Call','Email','Existing Client','Partner','Conference','Trade Show','Web Site','Word of Mouth','Internal HR','LinkedIn','Referral','Other'].map(s=>`<option ${r.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Campaign Source</label><input id="f-campaign" type="text" value="${r.campaign||''}"></div>
        <div class="lf-field"><label>Contact Name</label><input id="f-contactName" type="text" value="${r.contactName||''}"></div>
        <div class="lf-field"><label>Candidate Name</label><input id="f-candidateName" type="text" placeholder="Enter candidate name" value="${r.candidateName||''}"></div>
      </div>

      <!-- Recruitment Details -->
      <div class="lf-section-title" style="margin-top:32px">Recruitment Details</div>
      <div class="lf-grid">
        <div class="lf-field"><label>Recruiter Name</label>
          <input id="f-recruiterName" type="text" list="recruiter-list" placeholder="Type or select…" value="${r.recruiterName||''}" autocomplete="off">
          <datalist id="recruiter-list">
            ${['Urmila','Samyadeep','Sahil'].map(m=>`<option value="${m}">`).join('')}
            ${(typeof TEAM_MEMBERS!=='undefined'?TEAM_MEMBERS:[]).filter(m=>!['Urmila','Samyadeep','Sahil'].includes(m)).map(m=>`<option value="${m}">`).join('')}
          </datalist>
        </div>
        <div class="lf-field"><label>Client SPOC</label><select id="f-clientSpoc"><option value="">-None-</option>${['Vikram','Samyadeep'].map(m=>`<option ${r.clientSpoc===m?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Sourcer</label><select id="f-sourcer"><option value="">-None-</option>${['Samyadeep','Sahil','Urmila'].map(m=>`<option ${r.sourcer===m?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="lf-field"><label>Credit Sharing (%)</label><input id="f-creditSharing" type="number" min="0" max="100" step="1" placeholder="e.g. 50" value="${r.creditSharing!==undefined&&r.creditSharing!==''?r.creditSharing:''}"></div>
        <div class="lf-field" style="grid-column:1/-1"><label>Candidate Management</label><select id="f-candidateMgmt"><option value="">-None-</option>${['Urmila','Sahil','Samyadeep'].map(m=>`<option ${r.candidateMgmt===m?'selected':''}>${m}</option>`).join('')}</select></div>
      </div>

      <!-- Description Information -->
      <div class="lf-section-title" style="margin-top:32px">Description Information</div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:10px 8px;align-items:start">
        <label style="text-align:right;padding-right:8px;padding-top:8px;font-size:12px;font-weight:500;color:var(--fg2)">Description</label>
        <textarea id="f-description" rows="4">${r.description||''}</textarea>
      </div>`,
    save: (id) => {
      const amt = Number(v('amount')||0);
      const prob = parseFloat(v('probability')||0);
      // Preserve existing wonAt/lostAt from the record being edited
      const existing = id ? DB.deals.find(d=>d.id===id) : null;
      const stage = v('stage');
      const r = {
        name:v('name'), owner:v('owner'), companyName:v('companyName'), contactName:v('contactName'), candidateName:v('candidateName'),
        amount:amt, value:amt, closeDate:v('closeDate'), stage:stage,
        probability:prob, source:v('source'), dealType:v('dealType'),
        expectedRevenue:Math.round(amt*prob/100),
        campaign:v('campaign'), nextStep:v('nextStep'), description:v('description'),
        recruiterName:v('recruiterName'), sourcer:v('sourcer'),
        creditSharing:v('creditSharing')!==''?Number(v('creditSharing')):undefined,
        candidateMgmt:v('candidateMgmt'), clientSpoc:v('clientSpoc')
      };
      if (!r.name) return alert('Deal name required');
      if (!r.companyName) return alert('Company / Account is required');
      // Auto-set wonAt when stage is a won stage (Joined / Closed Won)
      if (WON_STAGES.has(stage)) {
        r.wonAt = (existing && existing.wonAt) || r.closeDate || new Date().toISOString().slice(0,10);
      }
      // Auto-set lostAt when stage is a lost stage (Absconded / Declined / Closed Lost)
      if (LOST_STAGES.has(stage)) {
        r.lostAt = (existing && existing.lostAt) || r.closeDate || new Date().toISOString().slice(0,10);
      }
      upsert('deals', id, r);
    }
  },
  task: {
    title: (id)=> id ? 'Edit Task' : 'Add Task',
    fields: (r={}) => `
      <div class="form-group"><label>Task *</label><input id="f-title" type="text" value="${r.title||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Type</label><select id="f-type"><option ${r.type==='Follow-up'?'selected':''}>Follow-up</option><option ${r.type==='BD Call'?'selected':''}>BD Call</option><option ${r.type==='Client Update'?'selected':''}>Client Update</option><option ${r.type==='Admin'?'selected':''}>Admin</option></select></div>
        <div class="form-group"><label>Owner</label><select id="f-owner">${TEAM_MEMBERS.map(m=>`<option ${r.owner===m?'selected':''}>${m}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Related To</label><input id="f-relatedTo" type="text" value="${r.relatedTo||''}"></div>
        <div class="form-group"><label>Due Date *</label><input id="f-due" type="date" value="${r.dueDate||r.due||''}"></div>
      </div>
      <div class="form-group"><label>Status</label><select id="f-status"><option ${r.status==='Pending'?'selected':''}>Pending</option><option ${r.status==='In Progress'?'selected':''}>In Progress</option><option ${r.status==='Done'?'selected':''}>Done</option></select></div>`,
    save: (id) => {
      const r = { title:v('title'), type:v('type'), owner:v('owner'), relatedTo:v('relatedTo'), dueDate:v('due'), status:v('status') };
      if (!r.title) return alert('Task description required');
      upsert('tasks', id, r);
    }
  },
  activity: {
    title: (id) => id ? 'Edit Activity' : 'Log Activity',
    fields: (r={}) => {
      const types = ['Call','Email','Meeting','LinkedIn'];
      const typeOpts = types.map(t=>`<option ${r.type===t?'selected':''}>${t}</option>`).join('');
      const ownerOpts = TEAM_MEMBERS.map(m=>`<option ${r.owner===m?'selected':''}>${m}</option>`).join('');
      // Normalize date: strip time portion if stored as ISO timestamp
      const dateVal = r.date ? r.date.slice(0,10) : today();
      const timeVal = r.time ? r.time.slice(0,5) : '';
      return `
      <div class="form-row">
        <div class="form-group"><label>Type</label><select id="f-type">${typeOpts}</select></div>
        <div class="form-group"><label>Date</label><input id="f-date" type="date" value="${dateVal}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Time</label><input id="f-time" type="time" value="${timeVal}"></div>
        <div class="form-group"></div>
      </div>
      <div class="form-group"><label>Summary *</label><textarea id="f-summary">${r.summary||r.subject||''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Contact</label><input id="f-contact" type="text" value="${r.contact||''}"></div>
        <div class="form-group"><label>Company</label><input id="f-company" type="text" value="${r.company||''}"></div>
      </div>
      <div class="form-group"><label>Owner</label><select id="f-owner">${ownerOpts}</select></div>`;
    },
    save: async (id) => {
      const r = { type:v('type'), date:v('date'), time:v('time')||null, summary:v('summary'), subject:v('summary'), contact:v('contact'), company:v('company'), owner:v('owner') };
      if (!r.summary) return alert('Summary required');
      upsert('activities', id, r);
      // Sync to Google Calendar for both new and edited activities
      if (gcalAccessToken) {
        const desc = [r.contact && 'Contact: ' + r.contact, r.company && 'Company: ' + r.company, 'Type: ' + r.type].filter(Boolean).join('\n');
        await gcalCreateEvent(r.summary, r.date, r.time||'', desc);
        showToast('Activity synced to Google Calendar 📅', 'success');
      }
    }
  },
  invoice: {
    title: (id)=> id ? 'Edit Invoice' : 'Raise Invoice',
    fields: (r={}) => `
      <div class="form-row">
        <div class="form-group"><label>Invoice No.</label><input id="f-invNo" type="text" value="${r.invNo||'INV-00'+(DB.invoices.length+1)}"></div>
        <div class="form-group"><label>Client</label><select id="f-companyId"><option value="">— Select —</option>${DB.companies.map(c=>`<option value="${c.id}" ${r.companyId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>Placement / Description</label><input id="f-placement" type="text" value="${r.placement||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Amount (₹)</label><input id="f-amount" type="number" value="${r.amount||''}"></div>
        <div class="form-group"><label>Status</label><select id="f-status"><option ${r.status==='Pending'?'selected':''}>Pending</option><option ${r.status==='Paid'?'selected':''}>Paid</option><option ${r.status==='Overdue'?'selected':''}>Overdue</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date Raised</label><input id="f-raised" type="date" value="${r.raised||today()}"></div>
        <div class="form-group"><label>Due Date</label><input id="f-due" type="date" value="${r.due||''}"></div>
      </div>`,
    save: (id) => {
      const r = { invNo:v('invNo'), companyId:v('companyId'), placement:v('placement'), amount:Number(v('amount')), status:v('status'), raised:v('raised'), due:v('due') };
      upsert('invoices', id, r);
    }
  },
  user: {
    title: (id)=> id ? 'Edit Member' : 'Add Team Member',
    fields: (r={}) => `
      <div class="form-row">
        <div class="form-group"><label>Full Name *</label><input id="f-name" type="text" value="${r.name||''}"></div>
        <div class="form-group"><label>Email</label><input id="f-email" type="email" value="${r.email||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Role</label><select id="f-role"><option ${r.role==='Founder / Admin'?'selected':''}>Founder / Admin</option><option ${r.role==='BD Manager'?'selected':''}>BD Manager</option><option ${r.role==='Senior Recruiter'?'selected':''}>Senior Recruiter</option><option ${r.role==='Recruiter'?'selected':''}>Recruiter</option><option ${r.role==='Operations'?'selected':''}>Operations</option></select></div>
        <div class="form-group"><label>Status</label><select id="f-status"><option ${r.status==='Active'?'selected':''}>Active</option><option ${r.status==='Inactive'?'selected':''}>Inactive</option></select></div>
      </div>`,
    save: (id) => {
      const r = { name:v('name'), email:v('email'), role:v('role'), status:v('status') };
      if (!r.name) return alert('Name required');
      upsert('users', id, r);
    }
  },
  document: {
    title: (id)=> id ? 'Edit Document' : 'Upload Document',
    fields: (r={}) => {
      const cats = getDocCategories();
      return `
      <div class="form-row">
        <div class="form-group"><label>Document Name *</label><input id="f-name" type="text" value="${esc(r.name||'')}"></div>
        <div class="form-group"><label>Client *</label><input id="f-clientName" type="text" placeholder="Enter client name" value="${esc(r.clientName||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Category *</label><select id="f-category"><option value="">— Select —</option>${cats.map(c=>`<option ${r.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Stage *</label><select id="f-stage"><option value="">— Select —</option>${['Draft','Internal Review','Sent to Client','Client Review','Approved','Signed / Completed'].map(s=>`<option ${r.stage===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Status *</label><select id="f-status"><option value="">— Select —</option>${['Pending','Active','Expired','Inactive','Rejected'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label>File Type</label><select id="f-fileType"><option value="">— Select —</option>${['PDF','DOCX','XLSX','PPTX','JPG','PNG','Other'].map(s=>`<option ${r.fileType===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Reference Number</label><input id="f-referenceNumber" type="text" value="${esc(r.referenceNumber||'')}"></div>
        <div class="form-group"><label>Uploaded By</label><input id="f-uploadedBy" type="text" value="${esc(r.uploadedBy||(LOGGED_IN_USER&&LOGGED_IN_USER.name)||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input id="f-startDate" type="date" value="${r.startDate||''}"></div>
        <div class="form-group"><label>Expiry Date</label><input id="f-expiryDate" type="date" value="${r.expiryDate||''}"></div>
      </div>
      <div class="form-group">
        <label>Attach File${r.fileUrl ? ' <span style="font-weight:400;color:var(--fg3)">(already uploaded)</span>' : ''}</label>
        <div id="doc-drop-zone" style="border:2px dashed var(--border);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s" onclick="document.getElementById('f-file').click()" ondragover="event.preventDefault();this.style.borderColor='var(--primary)';this.style.background='var(--surface2)'" ondragleave="this.style.borderColor='var(--border)';this.style.background=''" ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='';handleDocFileDrop(event)">
          <div style="font-size:28px;margin-bottom:6px">📎</div>
          <div style="font-size:13px;color:var(--fg2);font-weight:500">Click to browse or drag &amp; drop</div>
          <div style="font-size:11px;color:var(--fg3);margin-top:4px">PDF, DOCX, XLSX, PPTX, JPG, PNG — max 50 MB</div>
          ${r.fileUrl ? `<div style="margin-top:8px"><a href="${esc(r.fileUrl)}" target="_blank" style="font-size:12px;color:var(--primary)">View current file ↗</a></div>` : ''}
        </div>
        <input type="file" id="f-file" style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt" onchange="handleDocFileSelect(this)">
        <div id="doc-file-info" style="margin-top:8px;font-size:13px;color:var(--fg2);display:none">
          <span id="doc-file-name" style="font-weight:600"></span> — <span id="doc-file-size"></span>
        </div>
        <div id="doc-upload-progress" style="display:none;margin-top:8px">
          <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
            <div id="doc-progress-bar" style="height:100%;background:var(--primary);width:0%;transition:width .2s"></div>
          </div>
          <div id="doc-upload-status" style="font-size:12px;color:var(--fg3);margin-top:4px">Uploading…</div>
        </div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="f-description" rows="3">${esc(r.description||'')}</textarea></div>`;
    },
    save: async (id) => {
      const clientName = v('clientName').trim();
      const r = {
        name: v('name'), clientName,
        category: v('category'), stage: v('stage'), status: v('status'),
        fileType: v('fileType'), referenceNumber: v('referenceNumber'),
        uploadedBy: v('uploadedBy'), startDate: v('startDate'), expiryDate: v('expiryDate'),
        description: v('description')
      };
      if (!r.name) return alert('Document name is required');
      if (!r.clientName) return alert('Client name is required');
      if (!r.category) return alert('Please select a category');
      if (!r.stage) return alert('Please select a stage');
      if (!r.status) return alert('Please select a status');

      // Handle file upload if a new file was selected
      const fileInput = document.getElementById('f-file');
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        const uploaded = await uploadDocFile(file);
        if (!uploaded) return; // upload failed — error already shown
        r.fileUrl = uploaded.url;
        r.fileSize = formatFileSize(file.size);
        // Auto-detect file type from extension if not manually set
        if (!r.fileType) {
          const ext = file.name.split('.').pop().toUpperCase();
          const known = ['PDF','DOCX','DOC','XLSX','XLS','PPTX','PPT','JPG','JPEG','PNG'];
          r.fileType = known.includes(ext) ? (ext==='JPEG'?'JPG':ext==='DOC'?'DOCX':ext==='XLS'?'XLSX':ext==='PPT'?'PPTX':ext) : 'Other';
        }
      } else {
        // Keep existing fileUrl/fileSize when editing without replacing file
        const existing = id ? DB.documents.find(d => d.id === id) : null;
        if (existing) { r.fileUrl = existing.fileUrl; r.fileSize = existing.fileSize; }
      }
      upsert('documents', id, r);
    }
  }
};

function handleTopbarSearch(q) {
  q = q.trim().toLowerCase();
  // Find which page is currently active and search within it
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id; // e.g. 'page-companies'

  if (pageId === 'page-companies') {
    debounce('companies', () => searchFromDB('companies', q));
    // also update the page search input
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else if (pageId === 'page-leads') {
    debounce('leads', () => searchFromDB('leads', q));
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else if (pageId === 'page-contacts') {
    debounce('contacts', () => searchFromDB('contacts', q));
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else if (pageId === 'page-deals') {
    renderTable('deals', q);
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else if (pageId === 'page-activities') {
    renderTable('activities', q);
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else if (pageId === 'page-tasks') {
    renderTable('tasks', q);
    const inp = activePage.querySelector('.search-bar input');
    if (inp && inp.value !== q) inp.value = q;
  } else {
    // Try searching leads by default
    if (q) debounce('leads', () => searchFromDB('leads', q));
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 860) {
    // Mobile: overlay toggle
    if (sb.classList.contains('mobile-open')) { closeMobileNav(); } else { openMobileNav(); }
    return;
  }
  // Desktop: fully show or fully hide (no icon-strip mode)
  if (sb.classList.contains('app-visible')) {
    sb.classList.remove('app-visible');
    localStorage.setItem('sk_sidebar_hidden', '1');
  } else {
    sb.classList.add('app-visible');
    sb.classList.remove('collapsed');
    localStorage.removeItem('sk_sidebar_hidden');
  }
}
function openMobileNav() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('mobile-nav-overlay');
  sb.classList.add('mobile-open');
  ov.style.display = 'block';
}
function closeMobileNav() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('mobile-nav-overlay');
  sb.classList.remove('mobile-open');
  ov.style.display = 'none';
}
function toggleMobileNav() {
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('mobile-open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
}

// ── Create Panel ───────────────────────────────────────────
function toggleCreatePanel(e) {
  e.stopPropagation();
  // Don't open create panel while a full-page form is active
  const fp = document.getElementById('lead-form-overlay');
  if (fp && fp.style.display !== 'none') return;
  const p = document.getElementById('create-panel');
  const isOpen = p.style.display !== 'none';
  p.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // reset search
    const inp = document.getElementById('create-panel-search');
    if (inp) { inp.value = ''; filterCreatePanel(''); inp.focus(); }
    // close user panel if open
    const up = document.getElementById('user-panel');
    if (up) up.style.display = 'none';
  }
}
function buildAppsPanel() {
  const grid = document.getElementById('apps-panel-grid');
  if (!grid || grid.children.length) return; // already built
  const apps = [
    {icon:'📊',label:'Dashboard',page:'dashboard'},
    {icon:'🎯',label:'Leads',page:'leads'},
    {icon:'👥',label:'Contacts',page:'contacts'},
    {icon:'🏢',label:'Accounts',page:'companies'},
    {icon:'💼',label:'Deals',page:'deals'},
    {icon:'✅',label:'Tasks',page:'tasks'},
    {icon:'📅',label:'Calendar',page:'calendar'},
    {icon:'📣',label:'Campaigns',page:'campaigns'},
    {icon:'⚙️',label:'Settings',page:'personal-settings'},
  ];
  grid.innerHTML = apps.map(a => {
    const action = a.page === 'personal-settings' ? 'openPersonalSettings()' : `navigateTo('${a.page}')`;
    return `<div onclick="closeAppsPanel();${action}" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:10px;cursor:pointer;background:var(--bg);border:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='var(--bg)'">
      <span style="font-size:20px">${a.icon}</span>
      <span style="font-size:11px;font-weight:500;color:var(--fg2);text-align:center">${a.label}</span>
    </div>`;
  }).join('');
}
function toggleAppsPanel(e) {
  e.stopPropagation();
  const p = document.getElementById('apps-panel');
  if (!p) return;
  const isOpen = p.style.display !== 'none';
  closeCreatePanel();
  const up = document.getElementById('user-panel');
  if (up) up.style.display = 'none';
  if (!isOpen) buildAppsPanel();
  p.style.display = isOpen ? 'none' : 'block';
}
function closeAppsPanel() {
  const p = document.getElementById('apps-panel');
  if (p) p.style.display = 'none';
}
function closeCreatePanel() {
  const p = document.getElementById('create-panel');
  if (p) p.style.display = 'none';
}
function createPanelOpen(type) {
  closeCreatePanel();
  // Navigate to the right module page first, then open the form
  const moduleMap = { lead:'leads', contact:'contacts', company:'companies', deal:'deals', campaign:'commercial', task:'tasks', meeting:'activities', call:'activities' };
  const targetPage = moduleMap[type];
  if (targetPage) navigateTo(targetPage);
  setTimeout(() => openModal(type), 80);
}
function filterCreatePanel(q) {
  const term = q.toLowerCase().trim();
  document.querySelectorAll('#create-panel-list .cr-item').forEach(el => {
    const txt = el.textContent.toLowerCase();
    el.classList.toggle('cr-hidden', term && !txt.includes(term));
  });
}
document.addEventListener('click', function(e) {
  const p = document.getElementById('create-panel');
  const btn = document.getElementById('create-panel-btn');
  if (p && p.style.display !== 'none' && !p.contains(e.target) && btn && !btn.contains(e.target)) {
    p.style.display = 'none';
  }
});

// ── View Switcher ──────────────────────────────────────────
let currentDashView = 'user';
function toggleViewDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('view-dropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener('click', function() {
  const dd = document.getElementById('view-dropdown');
  if (dd) dd.style.display = 'none';
});
function setDashView(view) {
  currentDashView = view;
  document.getElementById('view-dropdown').style.display = 'none';
  // Update label + checkmarks
  const firstName = getCurrentUser() || 'My';
  const labels = { classic: 'Classic View', user: firstName + "'s Home", manager: "Manager's Home" };
  // Also update the dropdown option label
  const uLabel = document.getElementById('vopt-user-label');
  if (uLabel) uLabel.textContent = firstName + "'s Home";
  document.getElementById('view-switcher-label').textContent = labels[view];
  ['classic','user','manager'].forEach(v => {
    const el = document.getElementById('vopt-'+v);
    if (el) el.classList.toggle('active', v === view);
    const chk = document.getElementById('vopt-'+v+'-check');
    if (chk) chk.style.display = v === view ? '' : 'none';
  });
  renderDashboardView(view);
}
function showViewSwitcher(show) {
  const vs = document.getElementById('view-switcher');
  const tt = document.getElementById('topbar-title');
  if (vs) vs.style.display = show ? 'flex' : 'none';
  if (tt) tt.style.display = show ? 'none' : '';
}
function renderDashboardView(view) {
  const kpi  = document.getElementById('dash-kpi');
  const tm   = document.getElementById('dash-tasks-meetings');
  const ap   = document.getElementById('dash-activity-pipeline');
  let mgr    = document.getElementById('dash-manager-section');

  // Classic: KPI + pipeline only, no tasks/meetings or activity
  // User:    KPI + tasks/meetings + activity/pipeline (default personal)
  // Manager: everything + team summary card
  if (view === 'classic') {
    if (kpi) kpi.style.display = '';
    if (tm)  tm.style.display  = 'none';
    if (ap)  ap.style.display  = '';
  } else if (view === 'user') {
    if (kpi) kpi.style.display = '';
    if (tm)  tm.style.display  = '';
    if (ap)  ap.style.display  = '';
  } else if (view === 'manager') {
    if (kpi) kpi.style.display = 'none';
    if (tm)  tm.style.display  = 'none';
    if (ap)  ap.style.display  = 'none';
    // Inject manager section if not already there
    if (!mgr) {
      mgr = document.createElement('div');
      mgr.id = 'dash-manager-section';
      mgr.style.cssText = 'margin-top:0';
      document.getElementById('page-dashboard').appendChild(mgr);
    }
    // Always re-render with fresh data
    const now = new Date();
    const thisMonth = now.getMonth(); const thisYear = now.getFullYear();
    const dealsCreated = DB.deals.filter(d=>{ const dt=new Date(d.createdAt||d.closeDate||''); return dt.getMonth()===thisMonth&&dt.getFullYear()===thisYear; }).length;
    const revenue = DB.deals.filter(d=>isWon(d)).reduce((s,d)=>s+(parseFloat(d.value)||0),0);
    const dealsClosing = DB.deals.filter(d=>{ if(!d.closeDate)return false; const dt=new Date(d.closeDate); return dt.getMonth()===thisMonth&&dt.getFullYear()===thisYear&&isActive(d); }).length;
    const today = now.toISOString().slice(0,10);
    const overdueTasks = DB.tasks.filter(t=>(t.status==='Pending'||t.status==='In Progress')&&(t.dueDate||t.due)&&(t.dueDate||t.due)<today).length;
    // Quarter data
    function getQuarterLabel(offset) {
      let m = thisMonth - offset * 3; let y = thisYear;
      while(m<0){m+=12;y--;}
      const q = Math.floor(m/3)+1;
      return 'FY '+(q>=4?y+1:y)+'-Q'+q;
    }
    function quarterRange(offset) {
      let m = thisMonth - offset*3; let y = thisYear;
      while(m<0){m+=12;y--;}
      const qs = Math.floor(m/3)*3;
      return { y, qs, qe: qs+2 };
    }
    function qCount(arr, dateFn, offset, extra) {
      const {y,qs,qe} = quarterRange(offset);
      return arr.filter(x=>{ const d=new Date(dateFn(x)||''); return d.getFullYear()===y&&d.getMonth()>=qs&&d.getMonth()<=qe&&(!extra||extra(x)); }).length;
    }
    function qSum(arr, dateFn, valFn, offset, extra) {
      const {y,qs,qe} = quarterRange(offset);
      return arr.filter(x=>{ const d=new Date(dateFn(x)||''); return d.getFullYear()===y&&d.getMonth()>=qs&&d.getMonth()<=qe&&(!extra||extra(x)); }).reduce((s,x)=>s+(parseFloat(valFn(x))||0),0);
    }
    const qtrs = [3,2,1,0].map(i=>({label:getQuarterLabel(i),leadsCreated:qCount(DB.leads,l=>l.createdAt||l.date,i),dealsCreated:qCount(DB.deals,d=>d.createdAt||d.closeDate,i),dealsWon:qCount(DB.deals,d=>d.closeDate,i,d=>isWon(d)),revenue:qSum(DB.deals,d=>d.closeDate,d=>d.value,i,d=>isWon(d))}));
    // Source breakdown
    const srcMap = {};
    DB.leads.filter(l=>{ const dt=new Date(l.createdAt||l.date||''); return dt.getMonth()===thisMonth&&dt.getFullYear()===thisYear; }).forEach(l=>{ const s=l.source||'Unknown'; srcMap[s]=(srcMap[s]||0)+1; });
    const srcRows = Object.entries(srcMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
    // Pipeline by stage
    const stageMap = {};
    DB.deals.filter(d=>d.stage&&isActive(d)).forEach(d=>{ stageMap[d.stage]=(stageMap[d.stage]||0)+1; });
    const stageRows = Object.entries(stageMap).sort((a,b)=>b[1]-a[1]);
    // Top open deals
    const topOpen = [...DB.deals].filter(d=>isActive(d)).sort((a,b)=>(parseFloat(b.value)||0)-(parseFloat(a.value)||0)).slice(0,10);
    // Top closed deals this month
    const topClosed = DB.deals.filter(d=>{ const dt=new Date(d.closeDate||''); return isWon(d)&&dt.getMonth()===thisMonth&&dt.getFullYear()===thisYear; }).sort((a,b)=>(parseFloat(b.value)||0)-(parseFloat(a.value)||0)).slice(0,10);
    // Big deals lost
    const bigLost = DB.deals.filter(d=>{ const dt=new Date(d.closeDate||''); return d.stage==='Closed Lost'&&dt.getMonth()===thisMonth&&dt.getFullYear()===thisYear; }).sort((a,b)=>(parseFloat(b.value)||0)-(parseFloat(a.value)||0)).slice(0,10);
    // Top accounts by revenue
    const accRev = {};
    DB.deals.filter(d=>isWon(d)&&d.company).forEach(d=>{ accRev[d.company]=(accRev[d.company]||0)+(parseFloat(d.value)||0); });
    const topAcc = Object.entries(accRev).sort((a,b)=>b[1]-a[1]).slice(0,20);
    function fmt(n){const num=Number(n)||0;return '₹'+num.toLocaleString('en-IN',{maximumFractionDigits:2});}
    function emptyChart(label){return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:10px"><svg width="80" height="60" viewBox="0 0 80 60" fill="none"><path d="M10 50 Q20 20 30 35 Q40 50 50 25 Q60 0 70 15" stroke="#C8D3E8" stroke-width="2" fill="none"/><circle cx="30" cy="35" r="4" fill="#C8D3E8"/><circle cx="50" cy="25" r="4" fill="#C8D3E8"/><circle cx="70" cy="15" r="4" fill="#C8D3E8"/><line x1="5" y1="55" x2="75" y2="55" stroke="#C8D3E8" stroke-width="1.5"/><line x1="5" y1="10" x2="5" y2="55" stroke="#C8D3E8" stroke-width="1.5"/></svg><div style="font-size:13px;color:#8FA3C8">${label}</div></div>`;}

    // ── Anomaly chart builder ──────────────────────────────────────────────
    // Returns current FY quarter date range: { start, end, qLabel }
    function getCurrentFYQuarter() {
      const now = new Date();
      const m = now.getMonth(); // 0=Jan…11=Dec
      const y = now.getFullYear();
      // FY quarters: Q1=Apr-Jun(3-5), Q2=Jul-Sep(6-8), Q3=Oct-Dec(9-11), Q4=Jan-Mar(0-2)
      let qStart, qEnd, qLabel, fyYear;
      if (m >= 3 && m <= 5)      { qStart=new Date(y,3,1);   qEnd=new Date(y,5,30);  qLabel='Q1'; fyYear=y; }
      else if (m >= 6 && m <= 8) { qStart=new Date(y,6,1);   qEnd=new Date(y,8,30);  qLabel='Q2'; fyYear=y; }
      else if (m >= 9 && m <= 11){ qStart=new Date(y,9,1);   qEnd=new Date(y,11,31); qLabel='Q3'; fyYear=y; }
      else                        { qStart=new Date(y-1,0,1); qEnd=new Date(y-1,2,31);qLabel='Q4'; fyYear=y-1; }
      // cap end at today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (qEnd > today) qEnd = today;
      return { start: qStart, end: qEnd, qLabel, fyYear };
    }

    // Build day-by-day array from start to end
    function buildDailyArray(startD, endD) {
      const days = [];
      const d = new Date(startD);
      while (d <= endD) {
        days.push(d.toISOString().slice(0,10));
        d.setDate(d.getDate()+1);
      }
      return days;
    }

    // Render SVG anomaly line chart
    function anomalyChart(days, values, color, yLabel) {
      const W = 560, H = 180, padL = 44, padR = 16, padT = 18, padB = 36;
      const chartW = W - padL - padR;
      const chartH = H - padT - padB;
      const n = days.length;
      if (n === 0) return emptyChart('No data this quarter');

      const maxVal = Math.max(...values, 1);
      const mean = values.reduce((a,b)=>a+b,0) / n;
      const variance = values.reduce((a,v)=>a+(v-mean)**2,0) / n;
      const std = Math.sqrt(variance);
      const threshold = mean + 1.5 * std;

      // Anomaly = value > mean+1.5σ (spike) or value < mean-1.5σ (drop, skip zeros)
      const isAnomaly = v => std > 0 && (v > threshold || (v < mean - 1.5*std && v > 0));

      // x/y coord helpers
      const xc = i => padL + (n === 1 ? chartW/2 : i / (n-1) * chartW);
      const yc = v => padT + chartH - (v / maxVal * chartH);

      // Polyline path
      const points = values.map((v,i) => `${xc(i)},${yc(v)}`).join(' ');

      // Area fill path
      const areaPath = `M${xc(0)},${yc(0)} ` + values.map((v,i) => `L${xc(i)},${yc(v)}`).join(' ') + ` L${xc(n-1)},${padT+chartH} L${xc(0)},${padT+chartH} Z`;

      // Mean line
      const meanY = yc(mean);
      const threshY = std > 0 ? yc(threshold) : null;

      // X-axis labels: show ~6 evenly spaced dates
      const labelStep = Math.max(1, Math.floor(n / 6));
      const xLabels = days.map((d,i) => {
        if (i % labelStep !== 0 && i !== n-1) return '';
        const dt = new Date(d+'T00:00:00');
        return `<text x="${xc(i)}" y="${padT+chartH+14}" text-anchor="middle" font-size="9" fill="var(--fg3)">${dt.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]}</text>`;
      }).join('');

      // Y-axis labels
      const ySteps = [0, 0.5, 1];
      const yLabels = ySteps.map(f => {
        const vy = padT + chartH - f * chartH;
        const val = f * maxVal;
        const lab = val >= 100000 ? (val/100000).toFixed(1)+'L' : val >= 1000 ? (val/1000).toFixed(0)+'K' : val.toFixed(0);
        return `<text x="${padL-5}" y="${vy+3}" text-anchor="end" font-size="9" fill="var(--fg3)">${lab}</text>
                <line x1="${padL}" y1="${vy}" x2="${W-padR}" y2="${vy}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.5"/>`;
      }).join('');

      // Anomaly dots + tooltip data
      const dots = values.map((v,i) => {
        const cx = xc(i), cy = yc(v);
        if (isAnomaly(v)) {
          const dt = new Date(days[i]+'T00:00:00');
          const dtLabel = `${dt.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]}`;
          const valLabel = v >= 100000 ? '₹'+(v/100000).toFixed(2)+'L' : v >= 1000 ? '₹'+(v/1000).toFixed(1)+'K' : v.toString();
          return `<circle cx="${cx}" cy="${cy}" r="5" fill="#f43f5e" stroke="#fff" stroke-width="1.5">
            <title>${dtLabel}: ${valLabel} (anomaly)</title>
          </circle>`;
        }
        if (v > 0) return `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${color}" opacity="0.6"/>`;
        return '';
      }).join('');

      // Anomaly count badge
      const anomalyCount = values.filter(isAnomaly).length;
      const badgeHtml = anomalyCount > 0
        ? `<span style="font-size:11px;font-weight:600;color:#f43f5e;background:#fff1f2;border:1px solid #fecdd3;border-radius:20px;padding:2px 9px 2px 7px;display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;background:#f43f5e;border-radius:50%;display:inline-block"></span>${anomalyCount} spike${anomalyCount>1?'s':''} detected</span>`
        : `<span style="font-size:11px;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:2px 9px 2px 7px;display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block"></span>No anomalies</span>`;

      const svgStr = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
        <defs>
          <linearGradient id="aGrad_${color.slice(1)}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        ${yLabels}
        ${threshY ? `<line x1="${padL}" y1="${threshY}" x2="${W-padR}" y2="${threshY}" stroke="#f43f5e" stroke-width="1" stroke-dasharray="5 3" opacity="0.5"/>
        <text x="${W-padR-2}" y="${threshY-3}" text-anchor="end" font-size="8.5" fill="#f43f5e" opacity="0.7">threshold</text>` : ''}
        <path d="${areaPath}" fill="url(#aGrad_${color.slice(1)})"/>
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${xLabels}
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+chartH}" stroke="var(--border)" stroke-width="1"/>
        <line x1="${padL}" y1="${padT+chartH}" x2="${W-padR}" y2="${padT+chartH}" stroke="var(--border)" stroke-width="1"/>
      </svg>`;

      return `<div style="padding:10px 16px 6px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)">
        ${badgeHtml}
        <span style="font-size:11px;color:var(--fg3);margin-left:auto">Mean: ${mean.toFixed(1)} ${yLabel}/day</span>
      </div>
      <div style="padding:6px 0 0">${svgStr}</div>`;
    }

    // Build leads anomaly chart
    const { start: qS, end: qE, qLabel: qLbl } = getCurrentFYQuarter();
    const qDays = buildDailyArray(qS, qE);
    const leadsPerDay = qDays.map(d => DB.leads.filter(l => {
      const raw = l.createdAt || l.date || '';
      return raw && raw.slice(0,10) === d;
    }).length);
    const leadsAnomalyHtml = anomalyChart(qDays, leadsPerDay, '#6366f1', 'leads');

    // Build deals closure anomaly chart (sum expectedRevenue per day)
    const dealsPerDay = qDays.map(d => DB.deals.filter(deal => {
      if (!isWon(deal)) return false;
      const raw = deal.wonAt || deal.closeDate || deal.close_date || '';
      return raw && raw.slice(0,10) === d;
    }).reduce((s,deal) => s + Number(deal.expectedRevenue || deal.amount || 0), 0));
    const dealsAnomalyHtml = anomalyChart(qDays, dealsPerDay, '#10b981', '₹');

    function emptyFunnel(){return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:10px"><svg width="70" height="80" viewBox="0 0 70 80" fill="none"><polygon points="5,10 65,10 50,40 50,70 20,70 20,40" stroke="#C8D3E8" stroke-width="1.5" fill="none" stroke-linejoin="round"/><line x1="5" y1="5" x2="65" y2="5" stroke="#C8D3E8" stroke-width="2"/></svg><div style="font-size:13px;color:#8FA3C8">No data available</div></div>`;}
    function dealTable(rows,emptyMsg){
      if(!rows.length)return `<div style="padding:32px;text-align:center;color:var(--fg3);font-size:13px">${emptyMsg}</div>`;
      return `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px 14px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">Deal Name</th><th style="padding:8px 10px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">Account</th><th style="padding:8px 10px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:right;border-bottom:1px solid var(--border)">Amount</th></tr></thead><tbody>`+rows.map((d,i)=>`<tr><td style="padding:8px 14px;font-size:13px;color:var(--fg);border-bottom:1px solid var(--border)">${d.name||'—'}</td><td style="padding:8px 10px;font-size:12px;color:var(--fg2);border-bottom:1px solid var(--border)">${d.company||'—'}</td><td style="padding:8px 10px;font-size:13px;color:var(--fg);text-align:right;border-bottom:1px solid var(--border)">${fmt(parseFloat(d.value)||0)}</td></tr>`).join('')+'</tbody></table>';
    }
    mgr.innerHTML = `
      <!-- Manager KPI row -->
      <div class="grid-4 mb-16" style="margin-bottom:16px">
        <div class="stat-tile" style="cursor:pointer" onclick="navigateTo('deals')">
          <div class="label">Deals Created This Month</div>
          <div class="value">${dealsCreated}</div>
          <div style="margin-top:10px;opacity:0.35"><svg width="32" height="22" viewBox="0 0 32 22" fill="none"><rect x="1" y="10" width="4" height="12" fill="currentColor" rx="1"/><rect x="8" y="6" width="4" height="16" fill="currentColor" rx="1"/><rect x="15" y="1" width="4" height="21" fill="currentColor" rx="1"/><rect x="22" y="8" width="4" height="14" fill="currentColor" rx="1"/></svg></div>
        </div>
        <div class="stat-tile" style="cursor:pointer" onclick="navigateTo('deals')">
          <div class="label">Deals Closing This Month</div>
          <div class="value">${dealsClosing}</div>
          <div class="sub">Closing soon</div>
        </div>
        <div class="stat-tile" style="cursor:pointer" onclick="navigateTo('tasks')">
          <div class="label">Overdue Tasks</div>
          <div class="value">${overdueTasks}</div>
          <div class="sub">Past due date</div>
        </div>
      </div>

      <!-- Last 4 Quarter Performance -->
      <div class="card mb-16" style="margin-bottom:16px;padding:0;overflow:hidden">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:14px;font-weight:600;color:var(--fg)">Last 4 Quarter Performance Overview</span>
            <button style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 7px;cursor:pointer;color:var(--fg2);font-size:14px" title="Refresh">↻</button>
          </div>
          <span style="font-size:18px;color:var(--fg3);cursor:pointer">⋮</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="padding:10px 18px;background:var(--surface2);color:var(--fg3);font-size:12px;font-weight:600;text-align:left;border-bottom:1px solid var(--border);width:200px"></th>
            ${qtrs.map(q=>`<th style="padding:10px 14px;background:var(--surface2);color:var(--fg3);font-size:12px;font-weight:600;text-align:center;border-bottom:1px solid var(--border)">${q.label}</th>`).join('')}
          </tr></thead>
          <tbody>
            <tr><td style="padding:14px 18px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">Leads Created</td>${qtrs.map(q=>`<td style="padding:14px;font-size:14px;font-weight:600;color:var(--fg);text-align:center;border-bottom:1px solid var(--border)">${q.leadsCreated}</td>`).join('')}</tr>
            <tr><td style="padding:14px 18px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">Deals Created</td>${qtrs.map(q=>`<td style="padding:14px;font-size:14px;font-weight:600;color:var(--fg);text-align:center;border-bottom:1px solid var(--border)">${q.dealsCreated}</td>`).join('')}</tr>
            <tr><td style="padding:14px 18px;font-size:13px;color:var(--fg2);border-bottom:1px solid var(--border)">Deals Won</td>${qtrs.map(q=>`<td style="padding:14px;font-size:14px;font-weight:600;color:var(--fg);text-align:center;border-bottom:1px solid var(--border)">${q.dealsWon}</td>`).join('')}</tr>
            <tr><td style="padding:14px 18px;font-size:13px;color:var(--fg2)">Revenue</td>${qtrs.map(q=>`<td style="padding:14px;font-size:14px;font-weight:600;color:var(--fg);text-align:center">${q.revenue>0?fmt(q.revenue):'0'}</td>`).join('')}</tr>
          </tbody>
        </table>
      </div>

      <!-- Anomaly Leads + Leads By Source -->
      <div style="display:grid;grid-template-columns:1fr 380px;gap:16px;margin-bottom:16px">
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--fg)">Anomaly In Leads Creation — ${qLbl}</span><span style="font-size:11px;color:var(--fg3)">${qS.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${qE.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <span style="font-size:18px;color:var(--fg3);cursor:pointer">⋮</span>
          </div>
          <div>${leadsAnomalyHtml}</div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border)"><span style="font-size:14px;font-weight:600;color:var(--fg)">Leads By Source This Month</span></div>
          ${srcRows.length ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:10px 16px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">Lead Source</th><th style="padding:10px 14px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:right;border-bottom:1px solid var(--border)">Record Count</th></tr></thead><tbody>${srcRows.map((r,i)=>`<tr><td style="padding:10px 16px;font-size:13px;color:var(--fg);border-bottom:1px solid var(--border)">${i+1}.${r[0]}</td><td style="padding:10px 14px;font-size:13px;color:var(--fg);text-align:right;border-bottom:1px solid var(--border)">${r[1]}</td></tr>`).join('')}</tbody></table>` : `<div style="padding:28px;text-align:center;color:var(--fg3);font-size:13px">No lead source data this month</div>`}
        </div>
      </div>

      <!-- Anomaly Deals + Pipeline By Stage -->
      <div style="display:grid;grid-template-columns:1fr 380px;gap:16px;margin-bottom:16px">
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--fg)">Anomaly In Deals Closure Amount — ${qLbl}</span><span style="font-size:11px;color:var(--fg3)">${qS.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${qE.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <span style="font-size:18px;color:var(--fg3);cursor:pointer">⋮</span>
          </div>
          <div>${dealsAnomalyHtml}</div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border)"><span style="font-size:14px;font-weight:600;color:var(--fg)">Pipeline By Stage</span></div>
          ${stageRows.length ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:10px 16px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">Stage</th><th style="padding:10px 14px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:right;border-bottom:1px solid var(--border)">Deals</th></tr></thead><tbody>${stageRows.map(r=>`<tr><td style="padding:10px 16px;font-size:13px;color:var(--fg);border-bottom:1px solid var(--border)">${r[0]}</td><td style="padding:10px 14px;font-size:13px;color:var(--fg);text-align:right;border-bottom:1px solid var(--border)">${r[1]}</td></tr>`).join('')}</tbody></table>` : emptyFunnel()}
        </div>
      </div>

      <!-- Bottom 4-col tables -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px">
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--fg)">Top 10 Open Deals This Month</div>
          ${dealTable(topOpen,'No open deals')}
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--fg)">Top 10 Closed Deals This Mo...</div>
          ${dealTable(topClosed,'No closed deals this month')}
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--fg)">Big Deals Lost This Month</div>
          ${dealTable(bigLost,'No lost deals this month')}
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--fg)">Top 20 Accounts By Revenu...</div>
          ${topAcc.length ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px 14px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:left;border-bottom:1px solid var(--border)">Account</th><th style="padding:8px 10px;background:var(--surface2);color:var(--fg3);font-size:11px;font-weight:600;text-align:right;border-bottom:1px solid var(--border)">Revenue</th></tr></thead><tbody>${topAcc.map(r=>`<tr><td style="padding:8px 14px;font-size:12px;color:var(--fg);border-bottom:1px solid var(--border)">${r[0]}</td><td style="padding:8px 10px;font-size:12px;color:var(--fg);text-align:right;border-bottom:1px solid var(--border)">${fmt(r[1])}</td></tr>`).join('')}</tbody></table>` : `<div style="padding:32px;text-align:center;color:var(--fg3);font-size:13px">No account revenue data</div>`}
        </div>
      </div>`;
    mgr.style.display = '';
  }
  if (mgr && view !== 'manager') mgr.style.display = 'none';
}

