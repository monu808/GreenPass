import type { NextPageContext } from 'next';
import Link from 'next/link';

interface Props {
  statusCode?: number;
}

export default function Error({ statusCode }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 1rem',
      }}>
        <h1 style={{
          marginTop: '1.5rem',
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: '#111827',
        }}>
          {statusCode === 404 ? '404' : statusCode || 'Error'}
        </h1>
        <p style={{
          marginTop: '0.5rem',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#374151',
        }}>
          {statusCode === 404 ? 'Page Not Found' : 'An Error Occurred'}
        </p>
        <p style={{
          marginTop: '1rem',
          color: '#6b7280',
        }}>
          {statusCode === 404
            ? "The page you're looking for doesn't exist or has been moved."
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
