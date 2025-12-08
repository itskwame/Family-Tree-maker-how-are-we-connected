'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../components/SupabaseProvider';

export default function OnboardingWizard() {
  const supabase = useSupabase();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [addedMembers, setAddedMembers] = useState([]);
  const [currentRelationType, setCurrentRelationType] = useState('');
  const [userMemberId, setUserMemberId] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('Generating link...');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [generations, setGenerations] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    motherName: '',
    fatherName: '',
    memberName: ''
  });

  useEffect(() => {
    async function init() {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setCurrentUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
      }
    }
    init();
  }, [supabase, router]);

  const nextStep = async (step) => {
    if (step === 2) {
      if (!formData.firstName) {
        alert('Please enter your first name');
        return;
      }

      await supabase.from('profiles').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender
      }).eq('id', currentUser.id);

      const { data: member } = await supabase.from('family_members').insert({
        user_id: currentUser.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        created_by: currentUser.id
      }).select().single();

      setUserMemberId(member.id);
    }

    if (step === 3) {
      if (formData.motherName) {
        const { data } = await supabase.from('family_members').insert({
          first_name: formData.motherName.split(' ')[0],
          last_name: formData.motherName.split(' ').slice(1).join(' '),
          gender: 'female',
          created_by: currentUser.id
        }).select().single();

        if (data) {
          await supabase.from('relationships').insert({
            parent_id: data.id,
            child_id: userMemberId,
            relationship_type: 'parent'
          });
        }
      }

      if (formData.fatherName) {
        const { data } = await supabase.from('family_members').insert({
          first_name: formData.fatherName.split(' ')[0],
          last_name: formData.fatherName.split(' ').slice(1).join(' '),
          gender: 'male',
          created_by: currentUser.id
        }).select().single();

        if (data) {
          await supabase.from('relationships').insert({
            parent_id: data.id,
            child_id: userMemberId,
            relationship_type: 'parent'
          });
        }
      }
    }

    if (step === 4) {
      const { data } = await supabase.from('invitations').insert({
        sender_id: currentUser.id
      }).select().single();

      if (data) {
        setInviteCode(data.invite_code);
        const link = `${window.location.origin}/auth?invite=${data.invite_code}`;
        setInviteLink(link);
      }
    }

    setCurrentStep(step);
  };

  const prevStep = (step) => {
    setCurrentStep(step);
  };

  const skipStep = (step) => {
    setCurrentStep(step);
  };

  const openQuickAdd = (type) => {
    setCurrentRelationType(type);
    setShowAddMemberForm(true);
    setFormData({ ...formData, memberName: '' });
  };

  const addMember = async () => {
    if (!formData.memberName) return;

    const { data } = await supabase.from('family_members').insert({
      first_name: formData.memberName.split(' ')[0],
      last_name: formData.memberName.split(' ').slice(1).join(' '),
      created_by: currentUser.id
    }).select().single();

    if (data) {
      if (currentRelationType === 'sibling') {
        await supabase.from('relationships').insert([
          { parent_id: data.id, child_id: userMemberId, relationship_type: 'sibling' },
          { parent_id: userMemberId, child_id: data.id, relationship_type: 'sibling' }
        ]);
      } else if (currentRelationType === 'child') {
        await supabase.from('relationships').insert({
          parent_id: userMemberId,
          child_id: data.id,
          relationship_type: 'parent'
        });
      } else if (currentRelationType === 'spouse') {
        await supabase.from('relationships').insert([
          { parent_id: data.id, child_id: userMemberId, relationship_type: 'spouse' },
          { parent_id: userMemberId, child_id: data.id, relationship_type: 'spouse' }
        ]);
      }

      setAddedMembers([...addedMembers, { name: formData.memberName, type: currentRelationType }]);
      setShowAddMemberForm(false);
    }
  };

  const removeMember = (index) => {
    setAddedMembers(addedMembers.filter((_, i) => i !== index));
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    alert('Link copied to clipboard!');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join Our Family Tree!');
    const body = encodeURIComponent(`Hi!\n\nI've started building our family tree on FamilyConnect. Join me!\n\n${inviteLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const finishOnboarding = async () => {
    await supabase.from('profiles').update({
      onboarding_completed: true
    }).eq('id', currentUser.id);

    const { count } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true });

    setMemberCount(count || 0);
    setGenerations(count > 3 ? 2 : 1);
    setCurrentStep(5);
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', color: '#2d3748', marginBottom: '12px' }}>Welcome to FamilyConnect!</h1>
          <p style={{ color: '#718096', fontSize: '16px' }}>Let's build your family tree in just a few steps</p>
        </div>

        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '40px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width 0.3s', borderRadius: '4px', width: `${progress}%` }}></div>
        </div>

        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '24px', color: '#2d3748' }}>Tell us about yourself</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>First Name</label>
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>Last Name</label>
              <input
                type="text"
                placeholder="Smith"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button onClick={() => nextStep(2)} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', width: '100%' }}>
              Continue
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: '16px', color: '#2d3748' }}>Add your parents</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>This helps us start building your family tree</p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>Mother's Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>Father's Name</label>
              <input
                type="text"
                placeholder="Robert Smith"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => prevStep(1)} style={{ flex: 1, padding: '14px 32px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Back
              </button>
              <button onClick={() => nextStep(3)} style={{ flex: 1, padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Continue
              </button>
            </div>
            <button onClick={() => skipStep(3)} style={{ marginTop: '12px', width: '100%', padding: '14px 32px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
              Skip for now
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ marginBottom: '16px', color: '#2d3748' }}>Add siblings or other family</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>Quick add family members to your tree</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div onClick={() => openQuickAdd('sibling')} style={{ padding: '20px', background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="fas fa-users" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Add Sibling</span>
              </div>
              <div onClick={() => openQuickAdd('child')} style={{ padding: '20px', background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="fas fa-baby" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Add Child</span>
              </div>
              <div onClick={() => openQuickAdd('spouse')} style={{ padding: '20px', background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="fas fa-heart" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Add Spouse</span>
              </div>
              <div onClick={() => openQuickAdd('other')} style={{ padding: '20px', background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="fas fa-user-plus" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Add Other</span>
              </div>
            </div>

            {showAddMemberForm && (
              <div style={{ display: 'block', marginTop: '24px', padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>Add {currentRelationType.charAt(0).toUpperCase() + currentRelationType.slice(1)}</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2d3748' }}>Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                <button onClick={addMember} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', width: '100%' }}>
                  Add
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              {addedMembers.length > 0 && (
                <>
                  <p style={{ color: '#718096', fontSize: '14px', marginBottom: '12px' }}>Added:</p>
                  {addedMembers.map((m, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e6efff', color: '#667eea', padding: '8px 12px', borderRadius: '20px', margin: '4px', fontSize: '14px', fontWeight: 600 }}>
                      {m.name}
                      <i className="fas fa-times" onClick={() => removeMember(i)} style={{ cursor: 'pointer' }}></i>
                    </span>
                  ))}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => prevStep(2)} style={{ flex: 1, padding: '14px 32px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Back
              </button>
              <button onClick={() => nextStep(4)} style={{ flex: 1, padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 style={{ marginBottom: '16px', color: '#2d3748' }}>Invite your family!</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>Share your tree link so family members can join and add themselves</p>

            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '10px', border: '2px solid #e2e8f0', marginBottom: '20px', wordBreak: 'break-all', fontSize: '14px', color: '#2d3748', fontFamily: "'Courier New', monospace" }}>
              {inviteLink}
            </div>

            <button onClick={copyInviteLink} style={{ marginBottom: '12px', padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', width: '100%' }}>
              Copy Invite Link
            </button>
            <button onClick={shareViaEmail} style={{ padding: '14px 32px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', width: '100%' }}>
              Share via Email
            </button>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => prevStep(3)} style={{ flex: 1, padding: '14px 32px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Back
              </button>
              <button onClick={finishOnboarding} style={{ flex: 1, padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px' }}>
                Finish Setup
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '80px', color: '#48bb78', marginBottom: '24px' }}></i>
            <h2 style={{ fontSize: '28px', color: '#2d3748', marginBottom: '16px' }}>Your Family Tree is Ready!</h2>
            <p style={{ color: '#718096', fontSize: '16px', lineHeight: '1.6' }}>You've successfully set up your family tree. Now you can explore all features and continue building your family history.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '32px 0' }}>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>{memberCount}</div>
                <div style={{ color: '#718096', marginTop: '4px', fontSize: '13px' }}>Family Members</div>
              </div>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>{generations}+</div>
                <div style={{ color: '#718096', marginTop: '4px', fontSize: '13px' }}>Generations</div>
              </div>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>100%</div>
                <div style={{ color: '#718096', marginTop: '4px', fontSize: '13px' }}>Complete</div>
              </div>
            </div>

            <button onClick={goToDashboard} style={{ marginTop: '24px', padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', width: '100%' }}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
