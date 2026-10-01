import { useEffect, useState } from 'react'
import './App.css'

const companies = ['Vibro', 'HCL', 'TCS', 'Infosys', 'Wipro', 'Zoho', 'Cognizant', 'Accenture', 'Tech Mahindra', 'Capgemini']
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const emptyStudent = {
  name: '', studentId: '', department: '', year: '', section: '', bloodGroup: '',
  fatherName: '', motherName: '', email: '', arrears: '0',
}

function App() {
  const [view, setView] = useState('student')
  const [step, setStep] = useState(1)
  const [student, setStudent] = useState(emptyStudent)
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [students, setStudents] = useState([])
  const [companyFilter, setCompanyFilter] = useState('All companies')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({ studentId: '', email: '' })
  const [loginResult, setLoginResult] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (view !== 'admin') return undefined

    const controller = new AbortController()
    fetch('/api/registrations', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Could not load registrations.')
        setStudents(result.students)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setAdminError(error.message || 'Could not load registrations.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingStudents(false)
      })

    return () => controller.abort()
  }, [view])

  const updateStudent = (event) => {
    const { name, value } = event.target
    setStudent((current) => ({ ...current, [name]: value }))
  }

  const continueToCompanies = (event) => {
    event.preventDefault()
    if (Number(student.arrears) !== 0) return
    setStep(2)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleCompany = (company) => {
    setSelectedCompanies((current) => current.includes(company)
      ? current.filter((item) => item !== company)
      : current.length < 4 ? [...current, company] : current)
  }

  const submitRegistration = async (event) => {
    event.preventDefault()
    if (selectedCompanies.length !== 4) return
    setIsSaving(true)
    setFormError('')
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...student, arrears: Number(student.arrears), companies: selectedCompanies }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Registration could not be submitted.')
      setStudents((current) => [result.student, ...current.filter((item) => item.studentId !== result.student.studentId)])
      setStudent(emptyStudent)
      setSelectedCompanies([])
      setStep(1)
      setNotice(result.message || 'Registration submitted successfully.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setFormError(error.message || 'Registration could not be submitted. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const switchView = (nextView) => {
    if (nextView === 'admin' && view !== 'admin') {
      setIsLoadingStudents(true)
      setAdminError('')
    }
    setView(nextView)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')
    setLoginResult(null)
    try {
      const response = await fetch('/api/registrations/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCredentials),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not check this registration.')
      setLoginResult(result.student)
    } catch (error) {
      setLoginError(error.message || 'Could not check this registration. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const visibleStudents = companyFilter === 'All companies'
    ? students
    : students.filter((item) => item.companies.includes(companyFilter))

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => switchView('student')} aria-label="Campus Launch home">
          <span className="brand-mark">CL</span>
          <span>campus<span className="brand-light">launch</span></span>
        </a>
        <div className="topbar-right">
          <span className="academic-year">PLACEMENT CELL <i /> 2025–26</span>
          <div className="view-switch" role="tablist" aria-label="Choose view">
            <button className={view === 'student' ? 'active' : ''} onClick={() => switchView('student')} role="tab" aria-selected={view === 'student'}>Register</button>
            <button className={view === 'login' ? 'active' : ''} onClick={() => switchView('login')} role="tab" aria-selected={view === 'login'}>Login</button>
            <button className={view === 'admin' ? 'active' : ''} onClick={() => switchView('admin')} role="tab" aria-selected={view === 'admin'}>Admin</button>
          </div>
        </div>
      </header>

      <main id="home">
        {view === 'student' ? (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
                <h1>Placement registration</h1>
                <p className="heading-copy">Share your details and choose the companies you want to meet.</p>
              </div>
              <div className="deadline-note"><span className="deadline-dot" /> REGISTRATION OPEN</div>
            </section>

            {notice && <div className="success-notice" role="status">{notice}</div>}

            <div className="registration-layout">
              <aside className="steps-panel" aria-label="Registration steps">
                <p className="panel-kicker">REGISTRATION</p>
                <div className={`step-row ${step === 1 ? 'current' : 'complete'}`}>
                  <span className="step-number">{step > 1 ? '✓' : '01'}</span>
                  <span><strong>Student details</strong><small>Your profile & eligibility</small></span>
                </div>
                <div className="step-connector" />
                <div className={`step-row ${step === 2 ? 'current' : ''}`}>
                  <span className="step-number">02</span>
                  <span><strong>Company preferences</strong><small>Choose up to four</small></span>
                </div>
                <div className="steps-footnote">
                  <span className="footnote-icon">i</span>
                  <p>Keep your details accurate. Your placement cell will use this information to coordinate interviews.</p>
                </div>
              </aside>

              <section className="form-panel">
                {step === 1 ? (
                  <form onSubmit={continueToCompanies}>
                    <div className="form-heading">
                      <div><p className="panel-kicker">STEP 01 / 02</p><h2>Student details</h2></div>
                      <span className="required-note"><b>*</b> Required fields</span>
                    </div>
                    <div className="form-section-label">PERSONAL INFORMATION</div>
                    <div className="field-grid">
                      <label className="field wide"><span>Student name <b>*</b></span><input name="name" value={student.name} onChange={updateStudent} placeholder="As shown on your college ID" required /></label>
                      <label className="field"><span>Student ID <b>*</b></span><input name="studentId" value={student.studentId} onChange={updateStudent} placeholder="e.g. 23CS104" required /></label>
                      <label className="field"><span>Email address <b>*</b></span><input name="email" type="email" value={student.email} onChange={updateStudent} placeholder="you@college.edu" required /></label>
                      <label className="field"><span>Department <b>*</b></span><input name="department" value={student.department} onChange={updateStudent} placeholder="e.g. Computer Science" required /></label>
                      <label className="field"><span>Blood group <b>*</b></span><select name="bloodGroup" value={student.bloodGroup} onChange={updateStudent} required><option value="">Select blood group</option>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
                    </div>

                    <div className="form-section-label family-label">ACADEMIC & FAMILY DETAILS</div>
                    <div className="field-grid">
                      <label className="field"><span>Year <b>*</b></span><select name="year" value={student.year} onChange={updateStudent} required><option value="">Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option></select></label>
                      <label className="field"><span>Section <b>*</b></span><input name="section" value={student.section} onChange={updateStudent} placeholder="e.g. A" required /></label>
                      <label className="field"><span>Father&apos;s name <b>*</b></span><input name="fatherName" value={student.fatherName} onChange={updateStudent} placeholder="Enter full name" required /></label>
                      <label className="field"><span>Mother&apos;s name <b>*</b></span><input name="motherName" value={student.motherName} onChange={updateStudent} placeholder="Enter full name" required /></label>
                      <label className="field arrears-field"><span>Standing arrears <b>*</b></span><input name="arrears" type="number" min="0" step="1" value={student.arrears} onChange={updateStudent} required /><small>Students with zero standing arrears can register for companies.</small></label>
                    </div>

                    {Number(student.arrears) > 0 && <div className="eligibility-warning" role="status"><strong>Not eligible for company selection yet.</strong> Standing arrears must be zero to continue.</div>}
                    <div className="form-actions"><span>All information is kept with your placement cell.</span><button className="primary-button" type="submit" disabled={Number(student.arrears) !== 0}>Continue to companies <span aria-hidden="true">→</span></button></div>
                  </form>
                ) : (
                  <form onSubmit={submitRegistration}>
                    <div className="form-heading company-form-heading">
                      <div><p className="panel-kicker">STEP 02 / 02</p><h2>Choose your companies</h2><p className="form-subtitle">Pick exactly four companies to register your interest.</p></div>
                      <span className={`selection-count ${selectedCompanies.length === 4 ? 'filled' : ''}`}>{selectedCompanies.length}<span> / 4</span></span>
                    </div>
                    {formError && <div className="api-error" role="alert">{formError}</div>}
                    <div className="company-grid">
                      {companies.map((company, index) => {
                        const checked = selectedCompanies.includes(company)
                        return <button type="button" key={company} className={`company-option ${checked ? 'selected' : ''}`} onClick={() => { toggleCompany(company); setFormError('') }} aria-pressed={checked}>
                          <span className="company-initial">{company.slice(0, 1)}</span><span className="company-name">{company}</span><span className="company-check">{checked ? '✓' : '+'}</span><span className="company-index">{String(index + 1).padStart(2, '0')}</span>
                        </button>
                      })}
                    </div>
                    <div className="student-summary"><span className="summary-avatar">{student.name.trim().charAt(0).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.studentId} · {student.department}</small></span><button type="button" className="text-button" onClick={() => setStep(1)}>Edit details</button></div>
                    <div className="form-actions company-actions"><button className="back-button" type="button" onClick={() => setStep(1)}>← Back</button><button className="primary-button" type="submit" disabled={selectedCompanies.length !== 4 || isSaving}>{isSaving ? 'Submitting...' : 'Submit registration'} <span aria-hidden="true">→</span></button></div>
                  </form>
                )}
              </section>
            </div>
          </>
        ) : view === 'login' ? (
          <LoginView
            credentials={loginCredentials}
            setCredentials={setLoginCredentials}
            result={loginResult}
            error={loginError}
            isSubmitting={isLoggingIn}
            onSubmit={submitLogin}
          />
        ) : (
          <AdminDashboard students={students} companyFilter={companyFilter} setCompanyFilter={setCompanyFilter} visibleStudents={visibleStudents} isLoading={isLoadingStudents} error={adminError} />
        )}
      </main>
      <footer className="site-footer"><span>© 2025–26 Campus Launch</span><span>PLACEMENT CELL <i /> STUDENT PORTAL</span></footer>
    </div>
  )
}

function LoginView({ credentials, setCredentials, result, error, isSubmitting, onSubmit }) {
  const updateCredentials = (event) => {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">STUDENT PORTAL / REGISTRATION CHECK</p><h1>Find your registration</h1><p className="heading-copy">Sign in with the student ID and email used on your registration.</p></div>
      </section>
      <div className="registration-layout login-layout">
        <aside className="steps-panel login-aside">
          <p className="panel-kicker">STUDENT ACCESS</p>
          <div className="login-aside-copy"><span className="login-mark">ID</span><strong>Your placement profile, in one place.</strong><p>Check that your details and four company preferences were saved successfully.</p></div>
          <div className="steps-footnote"><span className="footnote-icon">i</span><p>This checks your saved registration. It is not password-based account security.</p></div>
        </aside>
        <section className="form-panel login-form-panel">
          <form onSubmit={onSubmit}>
            <div className="form-heading"><div><p className="panel-kicker">REGISTRATION LOOKUP</p><h2>Student login</h2></div></div>
            <div className="field-grid login-fields">
              <label className="field wide"><span>Student ID <b>*</b></span><input name="studentId" value={credentials.studentId} onChange={updateCredentials} placeholder="Enter your registered student ID" autoComplete="username" required /></label>
              <label className="field wide"><span>Registered email address <b>*</b></span><input name="email" type="email" value={credentials.email} onChange={updateCredentials} placeholder="you@college.edu" autoComplete="email" required /></label>
            </div>
            {error && <div className="api-error" role="alert">{error}</div>}
            <div className="form-actions login-actions"><span>Uses the student ID and email on your saved record.</span><button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Checking...' : 'Check registration'} <span aria-hidden="true">→</span></button></div>
            {result && <section className="login-result" aria-live="polite">
              <div className="login-result-heading"><span className="login-success-mark">OK</span><span><strong>Registration found</strong><small>Your details were retrieved from the database.</small></span></div>
              <dl className="login-result-details"><div><dt>Student</dt><dd>{result.name}</dd></div><div><dt>Student ID</dt><dd>{result.studentId}</dd></div><div><dt>Department</dt><dd>{result.department}</dd></div><div><dt>Year / Section</dt><dd>{result.year} / {result.section}</dd></div></dl>
              <p className="login-companies-label">COMPANY PREFERENCES</p><div className="preference-list login-preferences">{result.companies.map((company) => <span key={company}>{company}</span>)}</div>
            </section>}
          </form>
        </section>
      </div>
    </>
  )
}

function AdminDashboard({ students, companyFilter, setCompanyFilter, visibleStudents, isLoading, error }) {
  return (
    <>
      <section className="page-heading admin-heading">
        <div><p className="eyebrow">PLACEMENT CELL / OVERVIEW</p><h1>Student registrations</h1><p className="heading-copy">Review eligible students and their company preferences.</p></div>
        <div className="admin-total"><strong>{students.length.toString().padStart(2, '0')}</strong><span>TOTAL REGISTERED</span></div>
      </section>
      <section className="admin-panel">
        <div className="admin-toolbar"><div><p className="panel-kicker">REGISTRATION LIST</p><h2>{companyFilter === 'All companies' ? 'All students' : `${companyFilter} applicants`}</h2></div><label className="filter-control"><span>FILTER BY COMPANY</span><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}><option>All companies</option>{companies.map((company) => <option key={company}>{company}</option>)}</select></label></div>
        {error && <div className="api-error admin-error" role="alert">{error}</div>}
        <div className="table-wrap">
          <table><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>DEPARTMENT</th><th>YEAR / SEC</th><th>ARREARS</th><th>COMPANY PREFERENCES</th></tr></thead>
            <tbody>{isLoading ? <tr><td className="empty-state" colSpan="6"><strong>Loading registrations...</strong></td></tr> : visibleStudents.length ? visibleStudents.map((item) => <tr key={item.studentId}><td><div className="student-cell"><span className="table-avatar">{item.name.charAt(0).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td><td className="id-cell">{item.studentId}</td><td>{item.department}</td><td>{item.year} / {item.section}</td><td><span className="arrears-pill">{item.arrears}</span></td><td><div className="preference-list">{item.companies.filter((company) => companyFilter === 'All companies' || company === companyFilter).map((company) => <span key={company}>{company}</span>)}</div></td></tr>) : <tr><td className="empty-state" colSpan="6"><span className="empty-mark">—</span><strong>{students.length ? 'No students for this company' : 'No registrations yet'}</strong><small>{students.length ? 'Choose another company to view its applicants.' : 'Student registrations will appear here once submitted.'}</small></td></tr>}</tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {visibleStudents.length} of {students.length} registrations</span><span>ELIGIBILITY: ZERO STANDING ARREARS</span></div>
      </section>
    </>
  )
}

export default App
