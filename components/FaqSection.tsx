import React, { useState } from 'react';
import SectionHeader from './SectionHeader';

const faqData = [
    {
        question: "How can I become a club admin?",
        answer: "Club admin roles (Contributors) are assigned by the college administration. If you are a student leader or faculty coordinator, please contact the student affairs office to request contributor access for managing your club on the platform."
    },
    {
        question: "Where can I find photos or highlights from past events?",
        answer: "Yes! Navigate to any past event on the 'Events' page. If the organizers have uploaded highlights, you'll find a dedicated section with photo galleries, guest details, and winner announcements."
    },
    {
        question: "What is the difference between Events and Opportunities?",
        answer: "The 'Events' section lists all activities happening on our campus, organized by our own student clubs. The 'Opportunities' section features external events like national hackathons, internships, and workshops hosted by other top companies and institutions."
    },
    {
        question: "How do I apply to join a club?",
        answer: "Go to the club's detail page and look for the 'Join Us' section. If recruitment is open, you can click 'Apply Now' to fill out their application form. If it's closed, you can still send a joining request for the admins to consider later."
    }
];

const FaqItem: React.FC<{ faq: typeof faqData[0], isOpen: boolean, onClick: () => void }> = ({ faq, isOpen, onClick }) => {
    return (
        <div className="border-b border-slate-700 py-6">
            <button onClick={onClick} className="w-full flex justify-between items-center text-left">
                <h3 className="text-xl font-bold text-white">{faq.question}</h3>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                 <p className="text-gray-400 max-w-3xl">
                    {faq.answer}
                </p>
            </div>
        </div>
    )
}


const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    }
    
  return (
    <section className="py-16 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Frequently Asked Questions" align="left" />
        <div>
            {faqData.map((faq, index) => (
                <FaqItem 
                    key={index}
                    faq={faq}
                    isOpen={openIndex === index}
                    onClick={() => handleToggle(index)}
                />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;