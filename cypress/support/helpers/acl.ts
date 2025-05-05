import { acl } from 'rdf-namespaces'

interface AclConfig {
  permissions: ('Read' | 'Write' | 'Append' | 'Control')[]
  identifier?: string
  agents?: (string | URL)[]
  agentGroups?: (string | URL)[]
  agentClasses?: (string | URL)[]
  isDefault?: boolean
}

const generateAuthorization = (resource: string | URL, config: AclConfig) => {
  config.identifier ??= config.permissions.join('')
  const {
    permissions,
    agents,
    agentGroups,
    agentClasses,
    isDefault,
    identifier,
  } = config

  return `<#${identifier}> a <${acl.Authorization}>;
    ${
      agents && agents.length > 0
        ? `<${acl.agent}> ${agents.map(a => `<${a}>`).join(', ')};`
        : ''
    }
    ${
      agentGroups && agentGroups.length > 0
        ? `<${acl.agentGroup}> ${agentGroups.map(a => `<${a}>`).join(', ')};`
        : ''
    }
    ${
      agentClasses && agentClasses.length > 0
        ? `<${acl.agentClass}> ${agentClasses.map(a => `<${a}>`).join(', ')};`
        : ''
    }
    <${acl.accessTo}> <${resource}>;
    ${isDefault ? `<${acl.default__workaround}> <${resource}>;` : ''}
    <${acl.mode}> ${permissions.map(p => `<${acl[p]}>`).join(', ')}.`
}

export const generateAcl = (resource: string | URL, acls: AclConfig[]) =>
  acls.map(config => generateAuthorization(resource, config)).join('\n\n')
