<script setup lang="ts">
import PageView from "@/components/PageView.vue";
</script>

<template>
    <PageView>
        <template #header>
            <h1>privacy policy</h1>
        </template>
        <section class="privacy-content">
            <p>
                discuit search does not collect, store, or sell any personal
                data. we do not use cookies, analytics, or any third-party
                trackers. your search queries are not logged or associated with
                you.
            </p>
            <p>
                your ip address may appear in temporary server logs for
                technical reasons (like debugging or preventing abuse), but
                these logs are not kept long-term and are never shared or used
                for profiling.
            </p>
            <p>
                if you contact us directly, any info you provide will only be
                used to respond to your request.
            </p>
            <p>
                if you want something about you removed from the search index,
                just ask. i will delete it as soon as possible.
            </p>

            <h2>contact</h2>
            <ul>
                <li>
                    you can email me at
                    <a href="mailto:hai@wlo.moe">hai@wlo.moe</a>
                </li>
                <li>message me on discord @ <code>sillowww</code></li>
                <li>
                    or find me somewhere on discuit,
                    <a
                        href="https://discuit.org/@sillowww"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        https://discuit.org/@sillowww
                    </a>
                </li>
            </ul>
            <div class="heart"><3</div>
        </section>
    </PageView>
</template>

<style scoped>
h1 {
    font-weight: 600;
    color: hsl(var(--mauve));
    margin-bottom: 0.5rem;
    text-align: center;
}

.privacy-content {
    max-width: 568px;
    margin: 0 auto 0 auto;
    padding: 1rem;
    color: hsl(var(--subtext1));
    padding-bottom: 2rem;
    h2 {
        margin-top: 2rem;
        color: hsl(var(--mauve));
        font-weight: 600;
    }

    ul {
        margin: 1rem 0 0 1.5rem;
        padding: 0;
        list-style: disc;
    }
    p {
        margin-bottom: 1rem;
    }
    a {
        color: hsl(var(--blue));
        text-decoration: underline;
        font-weight: 500;
        transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
        &:hover {
            color: hsl(var(--mauve));
        }
    }
    code {
        background: hsla(var(--surface1) / 0.7);
        border-radius: 0.3em;
        padding: 0.1em 0.4em;
        font-size: 0.98em;
        color: hsl(var(--text));
    }
}

.heart {
    margin-top: 2.5rem;
    font-size: 2em;
    color: hsl(var(--rosewater));
    text-align: center;
    user-select: none;
}
</style>
