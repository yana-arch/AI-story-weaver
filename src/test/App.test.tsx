import { render, screen } from '@testing-library/react';
import App from '@/App';
import { SettingsProvider } from '@/contexts/SettingsContext';

describe('App', () => {
  it('renders the main application title', async () => {
    // Mock the window.matchMedia method
    window.matchMedia =
      window.matchMedia ||
      function () {
        return {
          matches: false,
          media: '',
          onchange: null,
          addListener: function () {},
          removeListener: function () {},
          addEventListener: function () {},
          removeEventListener: function () {},
          dispatchEvent: function () {
            return false;
          },
        };
      };

    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>
    );

    // The component creates a default story named "New Story" on first load.
    // We use findByText to wait for the async useEffect to run.
    expect(await screen.findByText(/New Story/i)).toBeInTheDocument();
  });
});
