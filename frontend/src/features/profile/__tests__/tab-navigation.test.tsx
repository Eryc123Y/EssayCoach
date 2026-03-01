import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TabNavigation } from '../components/tab-navigation';

describe('TabNavigation', () => {
  it('hides Achievements tab for non-students', () => {
    const { rerender } = render(
      <TabNavigation
        activeTab='essays'
        onTabChange={() => {}}
        userRole='lecturer'
      />
    );
    expect(screen.queryByText('Achievements')).not.toBeInTheDocument();

    rerender(
      <TabNavigation
        activeTab='essays'
        onTabChange={() => {}}
        userRole='student'
      />
    );
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });
});
