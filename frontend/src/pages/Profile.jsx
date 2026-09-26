import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Briefcase, GraduationCap, Phone, Droplet, X, Edit, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Profile = ({ memberId, onClose }) => {
  const { isAdmin } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const id = memberId || params.id;

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMemberDetails();
    }
  }, [id]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/members/${id}`);
      setMember(res.data);
    } catch (error) {
      console.error(error);
      // Mock data
      setMember({
        id: id,
        full_name: 'Amit Barai',
        occupation: 'Software Engineer',
        education: 'B.Sc in CSE, KUET',
        date_of_birth: '1995-10-15',
        blood_group: 'B+',
        contact_number: '+8801700000000',
        present_address: 'Dhaka, Bangladesh',
        permanent_address: 'Madaripur, Bangladesh',
        district: 'Madaripur',
        upazila: 'Kalkini',
        village: 'Enayetnagar',
        father_name: 'Father Name', // Placeholder
        mother_name: 'Mother Name', // Placeholder
      });
    } finally {
      setLoading(false);
    }
  };
  if (!id) return null;

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
        <span className="w-8 h-8 rounded-full bg-orange-500 animate-ping mb-4"></span>
        <p className="font-bold text-stone-600">Loading profile...</p>
      </div>
    </div>
  );
  if (!member) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm text-center relative">
        <button onClick={() => { if (onClose) onClose(); else navigate(-1); }} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><X size={20} /></button>
        <p className="font-bold text-red-500 text-lg mb-2">Member not found</p>
        <p className="text-stone-500 text-sm">The member you are looking for does not exist or has been removed.</p>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto custom-scroll py-6">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-2xl overflow-hidden border border-orange-100 animate-fade-in animate-slide-up relative mt-auto mb-auto">
        <button
          onClick={() => { if (onClose) onClose(); else navigate(-1); }}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>
        {/* Header / Cover */}
        <div className="h-24 bg-primary"></div>

        <div className="px-6 pb-6 relative">
          <div className="absolute top-8 right-6">
            <button
              onClick={() => {
                const parts = [member.country, member.district, member.upazila, member.village, member.home_name].filter(Boolean);
                if (parts.length === 5) {
                  if (onClose) onClose();
                  navigate(`/explorer/${parts.join('/')}`);
                } else {
                  alert("Member location data is incomplete to view the tree.");
                }
              }}
              className="bg-white border border-orange-200 text-orange-800 px-4 py-1.5 rounded-full shadow-sm hover:bg-orange-50 hover:border-orange-300 transition text-sm font-medium transform hover:scale-105 active:scale-95 duration-200"
            >
              View Tree
            </button>
          </div>
          <div className="flex flex-col items-center -mt-12 mb-4">
            <div className="h-24 w-24 bg-white rounded-full p-1 shadow-lg mb-3">
              <div className="h-full w-full bg-orange-100 rounded-full flex items-center justify-center text-secondary overflow-hidden">
                {member.profile_image_url ? (
                  <img src={member.profile_image_url} alt={member.full_name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
            </div>

            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-1 text-center">
              {(member.name_bangla || member.full_name).replace(' (Root)', '')}
            </h1>
            <div className="flex items-center text-stone-500 justify-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || 'Unknown Location'}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-primary border-b border-orange-100 pb-2">Personal Info</h2>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <Briefcase className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Occupation</span>
                  <span className="font-medium">{member.occupation || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <Briefcase className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Workplace</span>
                  <span className="font-medium">{member.workplace || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <GraduationCap className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Education</span>
                  <span className="font-medium">{member.education || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <Droplet className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Blood Group</span>
                  <span className="font-medium">{member.blood_group || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <Calendar className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Birth Date</span>
                  <span className="font-medium">{member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-primary border-b border-orange-100 pb-2">Contact & Family</h2>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <Phone className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Phone</span>
                  <span className="font-medium">{member.contact_number || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <MapPin className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-sm text-stone-500">Address</span>
                  <span className="font-medium">{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
              </div>

              {member.spouses && member.spouses.length > 0 && (
                <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                  <Heart className="h-5 w-5 text-red-500 mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">Spouses</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {member.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white">
                            {s.profile_image_url ? (
                              <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={12} className="m-auto text-orange-200" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-orange-900">{s.name_bangla || s.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                <User className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs uppercase tracking-wider text-stone-400 font-bold">Parents</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Father</span>
                      <span className="font-medium text-stone-700">{member.father_name_bangla || member.father_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold">Mother</span>
                      <span className="font-medium text-stone-700">{member.mother_name_bangla || member.mother_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {member.children && member.children.length > 0 && (
                <div className="flex items-start group hover:bg-orange-50 p-2 rounded transition-colors">
                  <User className="h-5 w-5 text-secondary mr-3 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="w-full">
                    <span className="block text-sm text-stone-500 mb-1">Children</span>
                    <div className="flex flex-col gap-2">
                      {member.children.map(child => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-secondary overflow-hidden shrink-0">
                            {child.profile_image_url ? (
                              <img src={child.profile_image_url} alt={child.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-medium text-sm hover:text-primary cursor-pointer transition-colors">{child.name_bangla || child.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
