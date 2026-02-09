# Contact Fields Implementation Guide

## ✅ Completed Backend Changes

### 1. Database Schema
- ✅ Updated [backend/supabase_migration.sql](backend/supabase_migration.sql:114-178) - Main contacts table with all new fields
- ✅ Created [backend/add_contact_fields.sql](backend/add_contact_fields.sql) - ALTER TABLE migration for existing databases

### 2. Backend Models & Schemas
- ✅ Updated [backend/app/models/Contact.py](backend/app/models/Contact.py) - SQLAlchemy model with all new fields
- ✅ Updated [backend/app/schemas/ContactSchema.py](backend/app/schemas/ContactSchema.py) - Pydantic schemas (ContactOut, ContactCreate, ContactUpdate)

### 3. TypeScript Types
- ✅ Updated [types.ts](types.ts:257-318) - Contact interface with all new fields

## 📋 Required Frontend Changes

### Step 1: Update ContactFormData Interface

In [components/ContactsPage.tsx](components/ContactsPage.tsx:32-45), update the `ContactFormData` interface:

```typescript
interface ContactFormData {
  // Existing fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  accountId: string;
  type: string;
  status: string;
  preferredContact: string;
  notes: string;

  // NEW FIELDS - Contact Image
  image: string;

  // NEW FIELDS - Description Information
  description: string;
  contactGroup: string;

  // NEW FIELDS - Extended Contact Information
  ctsiplEmail: string;
  pan: string;
  gstinNo: string;
  productInterested: string;
  productInterestedText: string;
  leadSource: string;
  leadCategory: string;
  designation: string;
  vendorName: string;
  partnerId: string;
  newLeads: boolean;

  // NEW FIELDS - Forms Info
  bandwidthRequired: string;
  productConfiguration: string;
  productDetails: string;
  rentalDuration: string;
  productNamePartNumber: string;
  specifications: string;

  // NEW FIELDS - Mailing Address
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  mailingCountry: string;

  // NEW FIELDS - Other Address
  otherStreet: string;
  otherCity: string;
  otherState: string;
  otherZip: string;
  otherCountry: string;
}
```

### Step 2: Update EMPTY_CONTACT_FORM

In [components/ContactsPage.tsx](components/ContactsPage.tsx:47-60), add the new fields:

```typescript
const EMPTY_CONTACT_FORM: ContactFormData = {
  // Existing fields
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mobile: '',
  jobTitle: '',
  department: '',
  accountId: '',
  type: '',
  status: 'Active',
  preferredContact: '',
  notes: '',

  // NEW - Contact Image
  image: '',

  // NEW - Description Information
  description: '',
  contactGroup: '',

  // NEW - Extended Contact Information
  ctsiplEmail: '',
  pan: '',
  gstinNo: '',
  productInterested: '',
  productInterestedText: '',
  leadSource: '',
  leadCategory: '',
  designation: '',
  vendorName: '',
  partnerId: '',
  newLeads: false,

  // NEW - Forms Info
  bandwidthRequired: '',
  productConfiguration: '',
  productDetails: '',
  rentalDuration: '',
  productNamePartNumber: '',
  specifications: '',

  // NEW - Mailing Address
  mailingStreet: '',
  mailingCity: '',
  mailingState: '',
  mailingZip: '',
  mailingCountry: '',

  // NEW - Other Address
  otherStreet: '',
  otherCity: '',
  otherState: '',
  otherZip: '',
  otherCountry: '',
};
```

### Step 3: Update openEditModal Function

In [components/ContactsPage.tsx](components/ContactsPage.tsx:208-227), update the function to include all new fields:

```typescript
const openEditModal = (contact: Contact) => {
  setFormData({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    mobile: contact.mobile || '',
    jobTitle: contact.jobTitle || '',
    department: contact.department || '',
    accountId: contact.accountId || '',
    type: contact.type || '',
    status: contact.status || 'Active',
    preferredContact: contact.preferredContact || '',
    notes: contact.notes || '',

    // NEW FIELDS
    image: contact.image || '',
    description: contact.description || '',
    contactGroup: contact.contactGroup || '',
    ctsiplEmail: contact.ctsiplEmail || '',
    pan: contact.pan || '',
    gstinNo: contact.gstinNo || '',
    productInterested: contact.productInterested || '',
    productInterestedText: contact.productInterestedText || '',
    leadSource: contact.leadSource || '',
    leadCategory: contact.leadCategory || '',
    designation: contact.designation || '',
    vendorName: contact.vendorName || '',
    partnerId: contact.partnerId || '',
    newLeads: contact.newLeads || false,
    bandwidthRequired: contact.bandwidthRequired || '',
    productConfiguration: contact.productConfiguration || '',
    productDetails: contact.productDetails || '',
    rentalDuration: contact.rentalDuration || '',
    productNamePartNumber: contact.productNamePartNumber || '',
    specifications: contact.specifications || '',
    mailingStreet: contact.mailingStreet || '',
    mailingCity: contact.mailingCity || '',
    mailingState: contact.mailingState || '',
    mailingZip: contact.mailingZip || '',
    mailingCountry: contact.mailingCountry || '',
    otherStreet: contact.otherStreet || '',
    otherCity: contact.otherCity || '',
    otherState: contact.otherState || '',
    otherZip: contact.otherZip || '',
    otherCountry: contact.otherCountry || '',
  });
  setEditingContactId(contact.id);
  setFormError('');
  setShowFormModal(true);
};
```

### Step 4: Add Form Fields to the Modal

Add the following sections after the existing form fields in [components/ContactsPage.tsx](components/ContactsPage.tsx:774-1000):

```tsx
{/* Contact Image */}
<div>
  <label htmlFor="image" className={labelClass}>Contact Image URL</label>
  <input
    id="image"
    name="image"
    type="text"
    placeholder="https://example.com/image.jpg"
    value={formData.image}
    onChange={handleFormChange}
    className={inputClass}
  />
</div>

{/* Description Information Section */}
<div className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Description Information</h3>

  <div>
    <label htmlFor="description" className={labelClass}>Description</label>
    <textarea
      id="description"
      name="description"
      placeholder="Contact description..."
      value={formData.description}
      onChange={handleFormChange}
      className={inputClass}
      rows={3}
    />
  </div>

  <div className="mt-4">
    <label htmlFor="contactGroup" className={labelClass}>Group</label>
    <input
      id="contactGroup"
      name="contactGroup"
      type="text"
      placeholder="Contact group"
      value={formData.contactGroup}
      onChange={handleFormChange}
      className={inputClass}
    />
  </div>
</div>

{/* Extended Contact Information */}
<div className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Extended Contact Information</h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label htmlFor="ctsiplEmail" className={labelClass}>CTSIPL E-mail</label>
      <input
        id="ctsiplEmail"
        name="ctsiplEmail"
        type="email"
        placeholder="ctsipl@example.com"
        value={formData.ctsiplEmail}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="designation" className={labelClass}>Designation</label>
      <input
        id="designation"
        name="designation"
        type="text"
        placeholder="Designation"
        value={formData.designation}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="pan" className={labelClass}>PAN</label>
      <input
        id="pan"
        name="pan"
        type="text"
        placeholder="ABCDE1234F"
        value={formData.pan}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="gstinNo" className={labelClass}>GSTIN No</label>
      <input
        id="gstinNo"
        name="gstinNo"
        type="text"
        placeholder="22AAAAA0000A1Z5"
        value={formData.gstinNo}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="productInterested" className={labelClass}>Product Interested</label>
      <select
        id="productInterested"
        name="productInterested"
        value={formData.productInterested}
        onChange={handleFormChange}
        className={selectClass}
      >
        <option value="">-None-</option>
        <option value="Product A">Product A</option>
        <option value="Product B">Product B</option>
        <option value="Product C">Product C</option>
      </select>
    </div>
    <div>
      <label htmlFor="leadSource" className={labelClass}>Lead Source</label>
      <select
        id="leadSource"
        name="leadSource"
        value={formData.leadSource}
        onChange={handleFormChange}
        className={selectClass}
      >
        <option value="">-None-</option>
        <option value="Website">Website</option>
        <option value="Referral">Referral</option>
        <option value="Cold Call">Cold Call</option>
        <option value="Social Media">Social Media</option>
      </select>
    </div>
  </div>

  <div>
    <label htmlFor="productInterestedText" className={labelClass}>Product Interested Text</label>
    <textarea
      id="productInterestedText"
      name="productInterestedText"
      placeholder="Additional product details..."
      value={formData.productInterestedText}
      onChange={handleFormChange}
      className={inputClass}
      rows={2}
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="leadCategory" className={labelClass}>Lead Category</label>
      <select
        id="leadCategory"
        name="leadCategory"
        value={formData.leadCategory}
        onChange={handleFormChange}
        className={selectClass}
      >
        <option value="">-None-</option>
        <option value="Hot">Hot</option>
        <option value="Warm">Warm</option>
        <option value="Cold">Cold</option>
      </select>
    </div>
    <div>
      <label htmlFor="vendorName" className={labelClass}>Vendor Name</label>
      <input
        id="vendorName"
        name="vendorName"
        type="text"
        placeholder="Vendor name"
        value={formData.vendorName}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="partnerId" className={labelClass}>Partner</label>
      <input
        id="partnerId"
        name="partnerId"
        type="text"
        placeholder="Partner ID"
        value={formData.partnerId}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div className="flex items-center mt-6">
      <input
        id="newLeads"
        name="newLeads"
        type="checkbox"
        checked={formData.newLeads}
        onChange={(e) => setFormData({ ...formData, newLeads: e.target.checked })}
        className="h-4 w-4 rounded"
      />
      <label htmlFor="newLeads" className="ml-2 text-sm">New Leads</label>
    </div>
  </div>
</div>

{/* Forms Info */}
<div className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Forms Info</h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label htmlFor="bandwidthRequired" className={labelClass}>Bandwidth Required</label>
      <input
        id="bandwidthRequired"
        name="bandwidthRequired"
        type="text"
        placeholder="e.g., 100 Mbps"
        value={formData.bandwidthRequired}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="rentalDuration" className={labelClass}>Rental Duration</label>
      <input
        id="rentalDuration"
        name="rentalDuration"
        type="text"
        placeholder="Starts from one month"
        value={formData.rentalDuration}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div>
    <label htmlFor="productConfiguration" className={labelClass}>Product Configuration</label>
    <textarea
      id="productConfiguration"
      name="productConfiguration"
      placeholder="Product configuration details..."
      value={formData.productConfiguration}
      onChange={handleFormChange}
      className={inputClass}
      rows={3}
    />
  </div>

  <div>
    <label htmlFor="productDetails" className={labelClass}>Enter Product Details</label>
    <textarea
      id="productDetails"
      name="productDetails"
      placeholder="Product details..."
      value={formData.productDetails}
      onChange={handleFormChange}
      className={inputClass}
      rows={3}
    />
  </div>

  <div>
    <label htmlFor="productNamePartNumber" className={labelClass}>Product Name and Part Number</label>
    <textarea
      id="productNamePartNumber"
      name="productNamePartNumber"
      placeholder="Product name and part number..."
      value={formData.productNamePartNumber}
      onChange={handleFormChange}
      className={inputClass}
      rows={2}
    />
  </div>

  <div>
    <label htmlFor="specifications" className={labelClass}>Specifications</label>
    <textarea
      id="specifications"
      name="specifications"
      placeholder="Technical specifications..."
      value={formData.specifications}
      onChange={handleFormChange}
      className={inputClass}
      rows={3}
    />
  </div>
</div>

{/* Address Information */}
<div className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Mailing Address</h3>

  <div>
    <label htmlFor="mailingStreet" className={labelClass}>Mailing Street</label>
    <textarea
      id="mailingStreet"
      name="mailingStreet"
      placeholder="Street address"
      value={formData.mailingStreet}
      onChange={handleFormChange}
      className={inputClass}
      rows={2}
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="mailingCity" className={labelClass}>Mailing City</label>
      <input
        id="mailingCity"
        name="mailingCity"
        type="text"
        placeholder="City"
        value={formData.mailingCity}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="mailingState" className={labelClass}>Mailing State</label>
      <input
        id="mailingState"
        name="mailingState"
        type="text"
        placeholder="State"
        value={formData.mailingState}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="mailingZip" className={labelClass}>Mailing Zip</label>
      <input
        id="mailingZip"
        name="mailingZip"
        type="text"
        placeholder="Zip/Postal Code"
        value={formData.mailingZip}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="mailingCountry" className={labelClass}>Mailing Country</label>
      <input
        id="mailingCountry"
        name="mailingCountry"
        type="text"
        placeholder="Country"
        value={formData.mailingCountry}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>
</div>

<div className="border-t pt-4 mt-4">
  <h3 className="text-sm font-semibold mb-3">Other Address</h3>

  <div>
    <label htmlFor="otherStreet" className={labelClass}>Other Street</label>
    <textarea
      id="otherStreet"
      name="otherStreet"
      placeholder="Street address"
      value={formData.otherStreet}
      onChange={handleFormChange}
      className={inputClass}
      rows={2}
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="otherCity" className={labelClass}>Other City</label>
      <input
        id="otherCity"
        name="otherCity"
        type="text"
        placeholder="City"
        value={formData.otherCity}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="otherState" className={labelClass}>Other State</label>
      <input
        id="otherState"
        name="otherState"
        type="text"
        placeholder="State"
        value={formData.otherState}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
    <div>
      <label htmlFor="otherZip" className={labelClass}>Other Zip</label>
      <input
        id="otherZip"
        name="otherZip"
        type="text"
        placeholder="Zip/Postal Code"
        value={formData.otherZip}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
    <div>
      <label htmlFor="otherCountry" className={labelClass}>Other Country</label>
      <input
        id="otherCountry"
        name="otherCountry"
        type="text"
        placeholder="Country"
        value={formData.otherCountry}
        onChange={handleFormChange}
        className={inputClass}
      />
    </div>
  </div>
</div>
```

## 📌 Deployment Steps

### 1. Run Database Migration

In Supabase SQL Editor, run:
```sql
-- For new deployments, the updated supabase_migration.sql includes all fields

-- For existing databases, run:
\i backend/add_contact_fields.sql
```

### 2. Restart Backend Server

```bash
cd backend
# Backend will auto-detect new model fields
python -m uvicorn app.main:app --reload --port 3002
```

### 3. Update Frontend

1. Update `ContactFormData` interface
2. Update `EMPTY_CONTACT_FORM` constant
3. Update `openEditModal` function
4. Add all new form fields to the modal
5. Test create/edit functionality

## 🎨 UI Considerations

The form modal already exists and opens as a dialog. The new fields are organized into sections:

1. **Contact Image** - Single field for image URL
2. **Description Information** - Description textarea and Group field
3. **Extended Contact Information** - 11 fields including PAN, GSTIN, Lead info
4. **Forms Info** - 6 fields for product configuration and specifications
5. **Mailing Address** - 5 fields for mailing address
6. **Other Address** - 5 fields for alternative address

Consider adding:
- Section headers with borders for visual separation
- Collapsible sections if the form becomes too long
- Field validation for PAN, GSTIN formats
- Partner dropdown (fetch from partners API)
- "Copy Address" button to copy mailing to other address

## ✨ Optional Enhancements

1. **Image Upload**: Replace URL input with file upload component
2. **Address Autocomplete**: Integrate with Google Places API
3. **Partner Lookup**: Dropdown with search for partner selection
4. **Form Tabs**: Organize fields into tabs (Basic Info, Address, Forms, etc.)
5. **Field Validation**: Add format validation for PAN, GSTIN, email fields
6. **Conditional Fields**: Show/hide fields based on contact type or status
