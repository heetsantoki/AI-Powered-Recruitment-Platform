import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { ToastContainer, useToast } from '../components/Toast'
import PhoneInput, { validatePhone } from '../components/PhoneInput'

const TABS = [
  { id: 'overview', name: '🏢 Company Overview' },
  { id: 'scale', name: '📊 Industry & Scale' },
  { id: 'contact', name: '📍 Location & Contact' },
  { id: 'recruiter', name: '👤 Recruiter Profile' },
  { id: 'culture', name: '🌟 Culture & Socials' }
]

export default function CompanyProfile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Form State
  const [form, setForm] = useState({
    company_name: '',
    company_website: '',
    company_logo: '',
    company_tagline: '',
    company_description: '',
    industry_type: '',
    company_size: '',
    company_type: '',
    headquarters_location: '',
    office_locations: [],
    company_contact_number: '',
    company_contact_email: '',
    recruiter_name: '',
    recruiter_designation: '',
    official_email: '',
    recruiter_linkedin: '',
    linkedin_company_page: '',
    twitter_profile: '',
    facebook_page: '',
    instagram_profile: '',
    work_culture: '',
    employee_benefits: '',
    work_model: ''
  })

  // Local state for office location inputs
  const [officeInput, setOfficeInput] = useState('')
  const fetchedRef = useRef(false)

  // Load existing profile if it exists and merge with draft if present
  useEffect(() => {
    if (!user || fetchedRef.current) return;
    
    fetchedRef.current = true;
    setFetching(true);
    
    api.get('/recruiter/profile')
      .then(res => {
        const draft = localStorage.getItem('recruiter_profile_draft');
        let initialForm = {};
        
        if (res.data) {
          initialForm = {
            ...res.data,
            recruiter_name: res.data.recruiter_name || user?.name || '',
            official_email: res.data.official_email || user?.email || '',
            office_locations: res.data.office_locations || []
          };
        } else {
          initialForm = {
            company_name: '',
            company_website: '',
            company_logo: '',
            company_tagline: '',
            company_description: '',
            industry_type: '',
            company_size: '',
            company_type: '',
            headquarters_location: '',
            office_locations: [],
            company_contact_number: '',
            company_contact_email: '',
            recruiter_name: user?.name || '',
            recruiter_designation: '',
            official_email: user?.email || '',
            recruiter_linkedin: '',
            linkedin_company_page: '',
            twitter_profile: '',
            facebook_page: '',
            instagram_profile: '',
            work_culture: '',
            employee_benefits: '',
            work_model: ''
          };
        }

        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            initialForm = { ...initialForm, ...parsedDraft };
          } catch (e) {}
        }
        
        setForm(initialForm);
        setFetching(false);
      })
      .catch(() => {
        const draft = localStorage.getItem('recruiter_profile_draft');
        if (draft) {
          try {
            setForm(JSON.parse(draft));
          } catch (e) {}
        }
        setFetching(false);
      });
  }, [user]);

  // Persist form input changes dynamically into draft so refreshing page doesn't lose progress
  useEffect(() => {
    if (!fetching) {
      localStorage.setItem('recruiter_profile_draft', JSON.stringify(form));
    }
  }, [form, fetching]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle Logo Upload and Convert to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.show('Please upload an image file.', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show('Image size must be less than 2MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, company_logo: reader.result }))
      toast.show('Logo uploaded successfully!', 'success')
    }
    reader.readAsDataURL(file)
  }

  // Handle Dynamic Office Locations List
  const handleAddOffice = (e) => {
    e.preventDefault()
    if (!officeInput.trim()) return
    if (form.office_locations.includes(officeInput.trim())) {
      toast.show('Location already added.', 'error')
      return
    }
    setForm(prev => ({
      ...prev,
      office_locations: [...prev.office_locations, officeInput.trim()]
    }))
    setOfficeInput('')
  }

  const handleRemoveOffice = (loc) => {
    setForm(prev => ({
      ...prev,
      office_locations: prev.office_locations.filter(l => l !== loc)
    }))
  }

  const validateTab = (tabId) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

    const checkURLFormat = (url) => {
      if (!url || !url.trim()) return false;
      let clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
      return urlRegex.test(clean);
    };

    if (tabId === 'overview') {
      if (!form.company_logo) return 'Company Logo is required.';
      if (!form.company_name.trim()) return 'Company Name is required.';
      if (!form.company_website.trim()) return 'Company Website URL is required.';
      if (!urlRegex.test(form.company_website.trim())) return 'Please enter a valid Company Website URL.';
      if (!form.company_tagline.trim()) return 'Company Tagline / Slogan is required.';
      if (!form.company_description.trim()) return 'About Us / Company Description is required.';
    }

    if (tabId === 'scale') {
      if (!form.industry_type.trim()) return 'Industry Type is required.';
      if (!form.company_size) return 'Company Size selection is required.';
      if (!form.company_type) return 'Company Type selection is required.';
    }

    if (tabId === 'contact') {
      if (!form.headquarters_location.trim()) return 'Headquarters Location is required.';
      
      let tempLocations = [...form.office_locations];
      if (officeInput.trim() && !tempLocations.includes(officeInput.trim())) {
        tempLocations.push(officeInput.trim());
      }
      if (tempLocations.length === 0) {
        return 'At least one Office Location is required. Make sure to type and add it.';
      }
      if (!form.company_contact_number.trim()) return 'Company Contact Number is required.';
      if (!validatePhone(form.company_contact_number.trim())) {
        return 'Please enter a valid Company Contact Number.';
      }
      if (!form.company_contact_email.trim()) return 'Company Contact Email is required.';
      if (!emailRegex.test(form.company_contact_email.trim())) {
        return 'Please enter a valid Company Contact Email.';
      }
    }

    if (tabId === 'recruiter') {
      if (!form.recruiter_name.trim()) return 'Recruiter Full Name is required.';
      if (!form.recruiter_designation.trim()) return 'Designation / Job Title is required.';
      if (!form.official_email.trim()) return 'Official Company Email is required.';
      if (!emailRegex.test(form.official_email.trim())) {
        return 'Please enter a valid Official Company Email.';
      }
      if (!form.recruiter_linkedin.trim()) return 'Recruiter LinkedIn Profile URL is required.';
      if (!checkURLFormat(form.recruiter_linkedin)) {
        return 'Please enter a valid URL for Recruiter LinkedIn Profile.';
      }
    }

    if (tabId === 'culture') {
      if (!form.linkedin_company_page.trim()) return 'LinkedIn Company Page URL is required.';
      if (!checkURLFormat(form.linkedin_company_page)) {
        return 'Please enter a valid URL for LinkedIn Company Page.';
      }
      if (!form.work_culture.trim()) return 'Work Culture Description is required.';
      if (!form.work_model) return 'Work Model selection is required.';
    }

    return null;
  };

  const handleTabSwitch = (targetTabId) => {
    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    const targetIdx = TABS.findIndex(t => t.id === targetTabId);

    if (targetIdx > activeIdx) {
      for (let i = activeIdx; i < targetIdx; i++) {
        const error = validateTab(TABS[i].id);
        if (error) {
          toast.show(error, 'error');
          setActiveTab(TABS[i].id);
          return;
        }
      }
    }
    setActiveTab(targetTabId);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-add dynamic officeInput value to locations array if they typed it but forgot to click the Add button!
    let updatedOfficeLocations = [...form.office_locations];
    if (officeInput.trim() && !updatedOfficeLocations.includes(officeInput.trim())) {
      updatedOfficeLocations.push(officeInput.trim());
    }

    // Sync input locations into final submission data
    const formToSubmit = {
      ...form,
      office_locations: updatedOfficeLocations
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

    const checkURLFormat = (url) => {
      if (!url || !url.trim()) return false;
      let clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
      return urlRegex.test(clean);
    };

    // Overview Tab Validations
    if (!formToSubmit.company_logo) {
      setActiveTab('overview');
      toast.show('Company Logo is required.', 'error');
      return;
    }
    if (!formToSubmit.company_name.trim()) {
      setActiveTab('overview');
      toast.show('Company Name is required.', 'error');
      return;
    }
    if (!formToSubmit.company_website.trim()) {
      setActiveTab('overview');
      toast.show('Company Website URL is required.', 'error');
      return;
    }
    if (!urlRegex.test(formToSubmit.company_website.trim())) {
      setActiveTab('overview');
      toast.show('Please enter a valid Company Website URL.', 'error');
      return;
    }
    if (!formToSubmit.company_tagline.trim()) {
      setActiveTab('overview');
      toast.show('Company Tagline / Slogan is required.', 'error');
      return;
    }
    if (!formToSubmit.company_description.trim()) {
      setActiveTab('overview');
      toast.show('About Us / Company Description is required.', 'error');
      return;
    }

    // Scale Tab Validations
    if (!formToSubmit.industry_type.trim()) {
      setActiveTab('scale');
      toast.show('Industry Type is required.', 'error');
      return;
    }
    if (!formToSubmit.company_size) {
      setActiveTab('scale');
      toast.show('Company Size selection is required.', 'error');
      return;
    }
    if (!formToSubmit.company_type) {
      setActiveTab('scale');
      toast.show('Company Type selection is required.', 'error');
      return;
    }

    // Contact Tab Validations
    if (!formToSubmit.headquarters_location.trim()) {
      setActiveTab('contact');
      toast.show('Headquarters Location is required.', 'error');
      return;
    }
    if (!formToSubmit.office_locations || formToSubmit.office_locations.length === 0) {
      setActiveTab('contact');
      toast.show('At least one Office Location is required. Make sure to type and add it.', 'error');
      return;
    }
    if (!formToSubmit.company_contact_number.trim()) {
      setActiveTab('contact');
      toast.show('Company Contact Number is required.', 'error');
      return;
    }
    if (!validatePhone(formToSubmit.company_contact_number.trim())) {
      setActiveTab('contact');
      toast.show('Please enter a valid Company Contact Number.', 'error');
      return;
    }
    if (!formToSubmit.company_contact_email.trim()) {
      setActiveTab('contact');
      toast.show('Company Contact Email is required.', 'error');
      return;
    }
    if (!emailRegex.test(formToSubmit.company_contact_email.trim())) {
      setActiveTab('contact');
      toast.show('Please enter a valid Company Contact Email.', 'error');
      return;
    }

    // Recruiter Tab Validations
    if (!formToSubmit.recruiter_name.trim()) {
      setActiveTab('recruiter');
      toast.show('Recruiter Full Name is required.', 'error');
      return;
    }
    if (!formToSubmit.recruiter_designation.trim()) {
      setActiveTab('recruiter');
      toast.show('Designation / Job Title is required.', 'error');
      return;
    }
    if (!formToSubmit.official_email.trim()) {
      setActiveTab('recruiter');
      toast.show('Official Company Email is required.', 'error');
      return;
    }
    if (!emailRegex.test(formToSubmit.official_email.trim())) {
      setActiveTab('recruiter');
      toast.show('Please enter a valid Official Company Email.', 'error');
      return;
    }
    if (!formToSubmit.recruiter_linkedin.trim()) {
      setActiveTab('recruiter');
      toast.show('Recruiter LinkedIn Profile URL is required.', 'error');
      return;
    }
    if (!checkURLFormat(formToSubmit.recruiter_linkedin)) {
      setActiveTab('recruiter');
      toast.show('Please enter a valid URL for Recruiter LinkedIn Profile.', 'error');
      return;
    }

    // Culture & Socials Tab Validations
    if (!formToSubmit.linkedin_company_page.trim()) {
      setActiveTab('culture');
      toast.show('LinkedIn Company Page URL is required.', 'error');
      return;
    }
    if (!checkURLFormat(formToSubmit.linkedin_company_page)) {
      setActiveTab('culture');
      toast.show('Please enter a valid URL for LinkedIn Company Page.', 'error');
      return;
    }
    
    const validateSocial = (url, label) => {
      if (url && url.trim() && !checkURLFormat(url)) {
        return `Please enter a valid URL for ${label}.`;
      }
      return null;
    };

    let socialErr = null;
    socialErr = socialErr || validateSocial(formToSubmit.twitter_profile, 'Twitter/X Profile');
    socialErr = socialErr || validateSocial(formToSubmit.facebook_page, 'Facebook Page');
    socialErr = socialErr || validateSocial(formToSubmit.instagram_profile, 'Instagram Profile');

    if (socialErr) {
      setActiveTab('culture');
      toast.show(socialErr, 'error');
      return;
    }

    if (!formToSubmit.work_culture.trim()) {
      setActiveTab('culture');
      toast.show('Work Culture Description is required.', 'error');
      return;
    }
    if (!formToSubmit.work_model) {
      setActiveTab('culture')
      toast.show('Work Model selection is required.', 'error')
      return
    }

    setLoading(true);
    try {
      const res = await api.post('/recruiter/profile', formToSubmit);
      if (res.data.success) {
        toast.show('Company profile successfully completed!', 'success');
        
        // Remove locally stored draft upon success
        localStorage.removeItem('recruiter_profile_draft');

        // Update user state context
        updateUser({ is_company_profile_completed: true, name: formToSubmit.recruiter_name });
        
        // Direct instant navigation to Dashboard
        navigate('/recruiter/dashboard');
      }
    } catch (err) {
      toast.show(err.response?.data?.error || 'Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="loading-screen"><div className="spinner" /></div>
  }

  // Calculate progress percent based on completed sections
  const getProgress = () => {
    const requiredFields = [
      form.company_logo,
      form.company_name.trim(),
      form.company_website.trim(),
      form.company_tagline.trim(),
      form.company_description.trim(),
      form.industry_type.trim(),
      form.company_size,
      form.company_type,
      form.headquarters_location.trim(),
      form.office_locations.length > 0,
      form.company_contact_number.trim(),
      form.company_contact_email.trim(),
      form.recruiter_name.trim(),
      form.recruiter_designation.trim(),
      form.official_email.trim(),
      form.recruiter_linkedin.trim(),
      form.linkedin_company_page.trim(),
      form.work_culture.trim(),
      form.work_model
    ];
    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  }

  const progressPercent = getProgress()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar showLinks={false} />
      <ToastContainer />

      <div style={{ maxWidth: 850, margin: '0 auto', padding: '100px 24px 60px' }}>
        
        {/* Onboarding Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="animate-in">
          <span className="badge badge-accent animate-pulse" style={{ textTransform: 'uppercase', marginBottom: 8, fontSize: '0.74rem' }}>
            👔 Mandatory Recruiter Onboarding
          </span>
          <h1 style={{ fontSize: '2rem', marginBottom: 8, color: '#fff' }}>Complete Your Company Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: 520, margin: '0 auto' }}>
            Set up your organization's brand identity. legitimate recruiters unlock candidate search, validation tools, and shortlisted candidate responses.
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Profile Strength Checklist</span>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{progressPercent}% Complete</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 20, paddingBottom: 6 }} className="scroll-x">
          {TABS.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabSwitch(t.id)}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  padding: '8px 14px'
                }}
              >
                {t.name}
              </button>
            )
          })}
        </div>

        {/* Main Card with Form */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '32px 24px', position: 'relative' }}>
            
            <AnimatePresence mode="wait">
              
              {/* SECTION 1: Company Overview */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary-light)' }}>
                    🏢 Company Overview
                  </h3>

                  {/* Logo Upload Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20, alignItems: 'center' }} className="media-grid">
                    <div style={{
                      width: 120, height: 120, borderRadius: 'var(--radius)', 
                      background: 'var(--bg-input)', border: '1.5px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'
                    }}>
                      {form.company_logo ? (
                        <img src={form.company_logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>🏢</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span className="form-label" style={{ fontSize: '0.8rem' }}>Company Logo Upload <span style={{ color: 'var(--accent)' }}>*</span></span>
                      <input 
                        type="file" 
                        id="logo-file-input" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: 'none' }} 
                      />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => document.getElementById('logo-file-input').click()}
                        >
                          Choose Image
                        </button>
                        {form.company_logo && (
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm" 
                            onClick={() => setForm(p => ({ ...p, company_logo: '' }))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: 0 }}>
                        Accepts JPG, PNG, GIF. Max size 2MB. Instantly displays in Candidate shortlists.
                      </p>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Company Name <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="company_name" placeholder="e.g. Acme Corporation" value={form.company_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Website URL <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="company_website" placeholder="e.g. https://acme.com" value={form.company_website} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company Tagline / Slogan <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <input className="form-input" type="text" name="company_tagline" placeholder="e.g. Building the future of recruitment." value={form.company_tagline} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">About Us / Company Description <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <textarea className="form-textarea" name="company_description" placeholder="Describe what your organization does, your vision, and mission..." value={form.company_description} onChange={handleChange} required />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleTabSwitch('scale')}>Next Section →</button>
                  </div>
                </motion.div>
              )}

              {/* SECTION 2: Industry & Scale */}
              {activeTab === 'scale' && (
                <motion.div
                  key="scale"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary-light)' }}>
                    📊 Industry & Scale
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Industry Type <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <input className="form-input" type="text" name="industry_type" placeholder="e.g. Information Technology, Healthcare, Finance" value={form.industry_type} onChange={handleChange} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Company Size <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <select className="form-select" name="company_size" value={form.company_size} onChange={handleChange} required>
                        <option value="">Select Size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Type <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <select className="form-select" name="company_type" value={form.company_type} onChange={handleChange} required>
                        <option value="">Select Type</option>
                        <option value="Startup">Startup</option>
                        <option value="Private Company">Private Company</option>
                        <option value="Public Company">Public Company</option>
                        <option value="Agency">Agency</option>
                        <option value="Non-Profit">Non-Profit</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTabSwitch('overview')}>← Back</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleTabSwitch('contact')}>Next Section →</button>
                  </div>
                </motion.div>
              )}

              {/* SECTION 3: Location & Contact */}
              {activeTab === 'contact' && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary-light)' }}>
                    📍 Location & Contact Details
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Headquarters Location <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <input className="form-input" type="text" name="headquarters_location" placeholder="e.g. San Francisco, CA" value={form.headquarters_location} onChange={handleChange} required />
                  </div>

                  {/* Dynamic Office Location Tags */}
                  <div className="form-group">
                    <label className="form-label">Office Locations (At least one office) <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        className="form-input" 
                        type="text" 
                        placeholder="Add location (e.g. London, UK)" 
                        value={officeInput} 
                        onChange={e => setOfficeInput(e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOffice(e) } }}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddOffice}>Add</button>
                    </div>
                    {form.office_locations.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {form.office_locations.map((loc, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {loc}
                            <span 
                              style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', fontWeight: 900 }} 
                              onClick={() => handleRemoveOffice(loc)}
                            >
                              ×
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Company Contact Number <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <PhoneInput
                        value={form.company_contact_number}
                        onChange={(val) => setForm(prev => ({ ...prev, company_contact_number: val }))}
                        placeholder="Enter company phone"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Contact Email <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="email" name="company_contact_email" placeholder="e.g. contact@acme.com" value={form.company_contact_email} onChange={handleChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTabSwitch('scale')}>← Back</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleTabSwitch('recruiter')}>Next Section →</button>
                  </div>
                </motion.div>
              )}

              {/* SECTION 4: Recruiter Profile */}
              {activeTab === 'recruiter' && (
                <motion.div
                  key="recruiter"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary-light)' }}>
                    👤 Recruiter Profile Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Recruiter Full Name <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="recruiter_name" placeholder="e.g. Jane Doe" value={form.recruiter_name} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Designation / Job Title <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="recruiter_designation" placeholder="e.g. Talent Acquisition Lead" value={form.recruiter_designation} onChange={handleChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Official Company Email <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="email" name="official_email" placeholder="e.g. jane.doe@acme.com" value={form.official_email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Recruiter LinkedIn Profile URL <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="recruiter_linkedin" placeholder="e.g. linkedin.com/in/janedoe" value={form.recruiter_linkedin} onChange={handleChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTabSwitch('contact')}>← Back</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleTabSwitch('culture')}>Next Section →</button>
                  </div>
                </motion.div>
              )}

              {/* SECTION 5: Culture & Socials */}
              {activeTab === 'culture' && (
                <motion.div
                  key="culture"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary-light)' }}>
                    🌟 Company Socials, Culture & Work Model
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">LinkedIn Company Page URL <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input className="form-input" type="text" name="linkedin_company_page" placeholder="e.g. linkedin.com/company/acme" value={form.linkedin_company_page} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Twitter / X Profile URL</label>
                      <input className="form-input" type="text" name="twitter_profile" placeholder="e.g. twitter.com/acme" value={form.twitter_profile} onChange={handleChange} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Facebook Page URL</label>
                      <input className="form-input" type="text" name="facebook_page" placeholder="e.g. facebook.com/acme" value={form.facebook_page} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Instagram Profile URL</label>
                      <input className="form-input" type="text" name="instagram_profile" placeholder="e.g. instagram.com/acme" value={form.instagram_profile} onChange={handleChange} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="media-grid">
                    <div className="form-group">
                      <label className="form-label">Employee Benefits / Perks</label>
                      <input className="form-input" type="text" name="employee_benefits" placeholder="e.g. Health insurance, Equity, Unlimited PTO, Gym membership" value={form.employee_benefits} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Model <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <select className="form-select" name="work_model" value={form.work_model} onChange={handleChange} required>
                        <option value="">Select Model</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-Site">On-Site</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Culture Description <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <textarea className="form-textarea" name="work_culture" placeholder="Explain the workplace vibe, core values, collaborative styles, and unique cultural highlights..." value={form.work_culture} onChange={handleChange} required />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTabSwitch('recruiter')}>← Back</button>
                    <button 
                      type="submit" 
                      className="btn btn-accent" 
                      disabled={loading} 
                      style={{ padding: '10px 24px' }}
                    >
                      {loading ? <><span className="spinner spinner-sm" />Saving Profile...</> : 'Complete Company Profile ✓'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  )
}
