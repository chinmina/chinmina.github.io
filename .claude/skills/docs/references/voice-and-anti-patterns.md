# Voice and Anti-Patterns

Full tone rules and anti-pattern examples for documentation writing. The condensed rules are in the parent SKILL.md; this reference provides the detailed good/bad example pairs.

## Tone and Voice

### Register: Technical-Professional

The documentation assumes a knowledgeable reader (DevOps engineers, platform engineers) but does not assume prior knowledge of this specific system. Technical terms are used directly without over-explanation.

**Example:**

> "Chinmina Bridge is a simple web service that acts as an intermediary between a Buildkite installation and a related GitHub App."

### Perspective (Content-Type Dependent)

**In Guides:** Use **second person ("you")** and **imperative mood**.

**Good:**

- "Before you start, there are a few things you'll need to have:"
- "Create an API key with access to the REST API."
- "Run `direnv allow` to bring the updated configuration into the environment."

**Bad:**

- "We will now explore how to set up the service..."
- "Let's create an API key together..."
- "I recommend that you consider using..."

**In Reference:** Use **third person** and **declarative mood**.

**Good:**

- "The port that the Chinmina service will bind to on startup."
- "The `timeout` field accepts an integer representing seconds."
- "The number of seconds the server will wait for existing requests to complete."

**Bad:**

- "The port you configure here will be used when the service starts."
- "You should set the timeout field to an integer."
- "You can configure the server to wait for requests."

Never use first person ("I" or "we") in any content type.

### Directness: High

State facts and instructions plainly. Avoid hedging and softening language.

**Good:**

- "This private key is an extremely sensitive credential."
- "Container distribution is recommended."
- "Chinmina needs to be self-hosted alongside the Buildkite agent infrastructure. It is a single point of failure in the system also."

**Bad:**

- "You might want to consider that this private key is somewhat sensitive..."
- "It's generally a good idea to use container distribution..."
- "While Chinmina typically needs to be self-hosted, this may vary..."

### Confidence: Assert with Honest Caveats

Make confident recommendations. State limitations clearly without apologizing.

**Good:**

- "It is **strongly** recommended that any production implementation of Chinmina (running on AWS) uses this strategy."
- "Using the `kms:RequestAlias` condition instead of the fully qualified key ARN in the `resource` attribute allows for transparent key rotation without service interruption."

Include dedicated sections for limitations when relevant:

**Drawbacks section example:**

> ## Drawbacks
>
> Chinmina needs to be self-hosted alongside the Buildkite agent infrastructure. It is a single point of failure in the system also, and critical to keep up.
>
> The private key for the GitHub application is quite powerful, and needs to be carefully protected.

## Anti-Patterns: What to Never Write

### No Filler Phrases

**Never use:**

- "Let's dive in"
- "In this guide, we will explore..."
- "It's important to note that..."
- "Now let's take a look at..."
- "As mentioned earlier..."
- "With that out of the way..."
- "Moving on to the next step..."

**Instead:** Start directly with the content.

**Bad:**

> "Now that we've covered the basics, let's dive into how to configure the server. It's important to note that..."

**Good:**

> "Configuration related to the core HTTP service."

### No Excessive Hedging

**Never use:**

- "You might want to consider..."
- "It's generally a good idea to..."
- "You could potentially..."
- "This may or may not be..."
- "In some cases, you might find that..."

**Instead:** State recommendations directly or don't make them.

**Bad:**

> "You might want to consider using a bot user to create the token, as this could potentially help when personnel changes occur..."

**Good:**

> "Use a 'bot' user to create the token if you can, as this will not be affected when personnel in your organization change."

### No Rhetorical Questions

**Never use:**

- "But what does this mean?"
- "So how does this work?"
- "Why would you want to do this?"
- "What's the best approach here?"

**Instead:** State information directly.

**Bad:**

> "But what does the audit log provide? Well, it gives you non-repudiation for the system."

**Good:**

> "Audit logs provide a level of non-repudiation for the system."

### No Apologetic Language

**Never use:**

- "This might seem complicated, but..."
- "Don't worry, this is easier than it looks..."
- "While this can be confusing..."
- "I know this seems like a lot..."

**Instead:** Present information straightforwardly. If content is incomplete, state that plainly.

**Bad:**

> "I know configuring KMS might seem complicated at first, but don't worry—we'll walk through it step by step."

**Good:**

> "This section is a stub. For now, refer to the `.envrc` file for details on the environment variables."

### No Redundant Transitions

Section transitions should be handled by clear headings, not prose.

**Bad:**

> "Now that we've covered the GitHub App setup, let's move on to the Buildkite token configuration..."

**Good:** (Just use a heading)

> ## Buildkite API Token
