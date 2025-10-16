import React from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../types';
import SectionHeader from './SectionHeader';

const categoryStyles: { [key: string]: string } = {
  'Recruitment': 'bg-blue-500/10 text-blue-400',
  'Event Result': 'bg-green-500/10 text-green-400',
  'Announcement': 'bg-yellow-500/10 text-yellow-400',
}

interface NewsProps {
    news: NewsArticle[];
}

const News: React.FC<NewsProps> = ({ news }) => {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
            title="Campus News & Announcements"
            subtitle="Stay up-to-date with the latest happenings, from event results to recruitment drives."
        />
        <div className="space-y-8 max-w-4xl mx-auto">
            {news.map(article => (
                <div key={article.id} className="bg-slate-900 p-6 rounded-lg shadow-md border border-slate-800 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[article.category]}`}>
                            {article.category}
                        </span>
                        <p className="text-sm text-gray-500">{article.date}</p>
                    </div>
                    <h3 className="mt-3 text-2xl font-bold text-white">{article.title}</h3>
                    <p className="mt-2 text-gray-400">{article.summary}</p>
                    {article.link && (
                        <div className="mt-4">
                            <Link
                                to={article.link.path}
                                className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors flex items-center group"
                            >
                                {article.link.text}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </section>
  );
};

export default News;