import React, { useEffect } from 'react';
import { useMessageTemplatesStore } from '../Controllers/MessageTemplatesStore';
import MessageTemplateDropdown from './MessageTemplateDropdown';

const LiveChatMessageTemplate = ({ handleTemplateChoice, searchTerm }) => {
  const { flows, searchFlows, hasMoreResults, loadMoreFlows, searching } = useMessageTemplatesStore();

  useEffect(() => {
    searchFlows(searchTerm);
  }, [searchTerm]);

  return (
    !searching && (
      <MessageTemplateDropdown
        id="message-template-dropdown"
        handleTemplateChoice={handleTemplateChoice}
        flows={flows}
        hasMoreResults={hasMoreResults}
        loadMoreFlows={loadMoreFlows}
      />
    )
  );
};

export default LiveChatMessageTemplate;
