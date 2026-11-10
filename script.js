(function () {
    document.documentElement.classList.add('js-ready');
    const now = new Date();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function parseStartDate(value) {
        if (!value || value === 'present' || value === 'now') {
            return new Date(now.getTime());
        }
        if (/^\d{4}$/.test(value)) {
            return new Date(Number(value), 0, 1);
        }
        if (/^\d{4}-\d{2}$/.test(value)) {
            const parts = value.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, 1);
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date(now.getTime()) : parsed;
    }

    function parseEndDate(value) {
        if (!value || value === 'present' || value === 'now') {
            return new Date(now.getTime());
        }
        if (/^\d{4}$/.test(value)) {
            return new Date(Number(value), 11, 31);
        }
        if (/^\d{4}-\d{2}$/.test(value)) {
            const parts = value.split('-').map(Number);
            return new Date(parts[0], parts[1], 0);
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date(now.getTime()) : parsed;
    }

    function isPresent(value) {
        return !value || value === 'present' || value === 'now';
    }

    function diffParts(start, end) {
        const from = new Date(start.getTime());
        const to = new Date(end.getTime());
        if (to < from) {
            return { years: 0, months: 0, days: 0, totalDays: 0 };
        }

        let years = to.getFullYear() - from.getFullYear();
        let months = to.getMonth() - from.getMonth();
        let days = to.getDate() - from.getDate();

        if (days < 0) {
            months -= 1;
            days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }

        return {
            years: years,
            months: months,
            days: days,
            totalDays: Math.floor((to.getTime() - from.getTime()) / 86400000)
        };
    }

    function plural(count, singular) {
        return count + ' ' + (count === 1 ? singular : singular + 's');
    }

    function formatDuration(parts, options) {
        const includeDays = options && options.includeDays;
        const items = [];
        if (parts.years > 0) items.push(plural(parts.years, 'yr'));
        if (parts.months > 0) items.push(plural(parts.months, 'mo'));
        if (includeDays || (parts.years === 0 && parts.months === 0)) {
            items.push(plural(Math.max(parts.days, 0), 'day'));
        }
        return items.join(' ') || '0 days';
    }

    function formatAgo(parts) {
        if (parts.years > 0) return plural(parts.years, 'yr') + ' ago';
        if (parts.months > 0) return plural(parts.months, 'mo') + ' ago';
        return plural(Math.max(parts.days, 0), 'day') + ' ago';
    }

    function mergeIntervals(intervals) {
        if (!intervals.length) return [];
        const sorted = intervals.slice().sort(function (a, b) { return a.start - b.start; });
        const merged = [{ start: sorted[0].start, end: sorted[0].end }];
        for (let i = 1; i < sorted.length; i += 1) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            if (current.start <= last.end) {
                last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
            } else {
                merged.push({ start: current.start, end: current.end });
            }
        }
        return merged;
    }

    function sumDurations(intervals) {
        return intervals.reduce(function (total, interval) {
            const parts = diffParts(interval.start, interval.end);
            total.years += parts.years;
            total.months += parts.months;
            total.days += parts.days;
            return total;
        }, { years: 0, months: 0, days: 0 });
    }

    function normalizeDuration(parts) {
        let months = parts.months + Math.floor(parts.days / 30);
        let days = parts.days % 30;
        let years = parts.years + Math.floor(months / 12);
        months = months % 12;
        return { years: years, months: months, days: days };
    }

    function updateAge() {
        const ageEl = document.getElementById('user-age');
        if (!ageEl) return;
        const parts = diffParts(parseStartDate(ageEl.getAttribute('data-birthdate')), now);
        ageEl.textContent = parts.years + '+';
        ageEl.setAttribute('title', parts.years + ' years ' + parts.months + ' months ' + parts.days + ' days');
    }

    function updateTimelineDates() {
        document.querySelectorAll('.timeline-date').forEach(function (stamp) {
            const startValue = stamp.getAttribute('data-start');
            const endValue = stamp.getAttribute('data-end');
            const format = stamp.getAttribute('data-format') || 'year';
            const start = parseStartDate(startValue);
            const end = parseEndDate(endValue);
            const parts = diffParts(start, isPresent(endValue) ? now : end);
            const ago = diffParts(end, now);
            const durationEl = stamp.parentElement && stamp.parentElement.querySelector('.duration-text');
            if (!durationEl) return;

            durationEl.textContent = format === 'range'
                ? formatDuration(parts, { includeDays: parts.years === 0 })
                : formatAgo(ago);

            stamp.setAttribute('title', formatDuration(parts, { includeDays: true }));
        });
    }

    function updateStatusTitles() {
        document.querySelectorAll('[data-status-end]').forEach(function (title) {
            const end = parseEndDate(title.getAttribute('data-status-end'));
            const ongoing = title.getAttribute('data-title-ongoing');
            const complete = title.getAttribute('data-title-complete');
            if (now > end && complete) {
                title.textContent = complete;
            } else if (ongoing) {
                title.textContent = ongoing;
            }
        });
    }

    function updateExperienceCounter() {
        const counter = document.getElementById('exp-counter');
        const label = document.getElementById('exp-counter-label');
        const roles = document.querySelectorAll('.experience-item');
        if (!counter || !label || !roles.length) return;

        const intervals = Array.prototype.map.call(roles, function (role) {
            return {
                start: parseStartDate(role.getAttribute('data-start')),
                end: parseEndDate(role.getAttribute('data-end'))
            };
        });

        const total = normalizeDuration(sumDurations(mergeIntervals(intervals)));
        counter.setAttribute('title', total.years + ' years ' + total.months + ' months ' + total.days + ' days');

        if (total.years >= 1) {
            counter.textContent = total.years + (total.months > 0 || total.days > 0 ? '+' : '');
            label.textContent = 'Years of experience';
        } else if (total.months >= 1) {
            counter.textContent = String(total.months);
            label.textContent = 'Months of experience';
        } else {
            counter.textContent = String(Math.max(total.days, 0));
            label.textContent = 'Days of experience';
        }
    }

    function animateCount(el) {
        const endValue = Number(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        if (!endValue || prefersReducedMotion) {
            el.textContent = endValue + suffix;
            return;
        }
        const duration = 900;
        const startTime = performance.now();
        function tick(nowTime) {
            const progress = Math.min((nowTime - startTime) / duration, 1);
            el.textContent = Math.round(endValue * (1 - Math.pow(1 - progress, 3))) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCount);
            return;
        }
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (counter) { observer.observe(counter); });
    }

    function initReveal() {
        const items = document.querySelectorAll('.reveal');
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            items.forEach(function (item) { item.classList.add('in-view'); });
            return;
        }
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        items.forEach(function (item) { observer.observe(item); });
    }

    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const links = document.querySelectorAll('header .navbar a[href^="#"]');
        if (!sections.length || !links.length) return;

        function setActive() {
            const scrollPos = window.scrollY + 120;
            let currentId = sections[0].id;
            sections.forEach(function (section) {
                if (section.offsetTop <= scrollPos) currentId = section.id;
            });
            links.forEach(function (link) {
                link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
            });
        }

        setActive();
        window.addEventListener('scroll', setActive, { passive: true });
    }

    function initTyping() {
        const el = document.getElementById('typed-role');
        const roles = ['Full Stack Java Developer', 'Full Stack Developer', 'Java Developer', 'Angular Developer', 'CI/CD Practitioner'];
        if (!el || prefersReducedMotion) return;

        let roleIndex = 0;
        let charIndex = 0;
        let deleting = false;

        function tick() {
            const current = roles[roleIndex];
            el.textContent = current.slice(0, charIndex);
            if (!deleting && charIndex < current.length) {
                charIndex += 1;
                setTimeout(tick, 78);
                return;
            }
            if (!deleting && charIndex === current.length) {
                deleting = true;
                setTimeout(tick, 1400);
                return;
            }
            if (deleting && charIndex > 0) {
                charIndex -= 1;
                setTimeout(tick, 42);
                return;
            }
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(tick, 280);
        }

        tick();
    }

    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;

        function update() {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const value = max > 0 ? (window.scrollY / max) * 100 : 0;
            bar.style.width = value + '%';
        }

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
    }

    function initContactForm() {
        const form = document.getElementById('contact-form');
        const button = document.getElementById('sbmt');
        const dialog = document.getElementById('mail-dialog');
        const dialogTitle = document.getElementById('mail-dialog-title');
        const dialogText = document.getElementById('mail-dialog-text');
        const dialogIcon = document.getElementById('mail-dialog-icon');
        const dialogClose = document.getElementById('mail-dialog-close');
        const nextField = document.getElementById('form-next');
        const MAILBOX = 'meghrajgupta58@gmail.com';

        if (!form || !button || !dialog) return;

        function showMailDialog(type, title, text) {
            dialog.classList.toggle('is-error', type === 'error');
            dialog.classList.toggle('is-success', type === 'success');
            dialog.classList.toggle('is-info', type === 'info');
            dialogIcon.innerHTML = type === 'error'
                ? '<i class="fa-solid fa-circle-exclamation"></i>'
                : type === 'info'
                    ? '<i class="fa-solid fa-envelope-open-text"></i>'
                    : '<i class="fa-solid fa-circle-check"></i>';
            dialogTitle.textContent = title;
            dialogText.textContent = text;
            dialog.hidden = false;
        }

        function hideMailDialog() {
            dialog.hidden = true;
        }

        function digitsOnly(value) {
            return String(value).replace(/\D/g, '');
        }

        function isValidPhone(value) {
            const digits = digitsOnly(value);
            return digits.length === 10 || (digits.length === 12 && digits.indexOf('91') === 0);
        }

        function buildNextUrl() {
            if (location.protocol !== 'http:' && location.protocol !== 'https:') return '';
            const url = new URL(location.href);
            url.searchParams.set('mail', 'sent');
            url.hash = 'contact';
            return url.toString();
        }

        function sendViaFormSubmit(data) {
            const body = new FormData();
            body.append('name', data.name);
            body.append('email', data.email);
            body.append('phone', data.phone);
            body.append('message', data.message);
            body.append('_replyto', data.email);
            body.append('_subject', 'New portfolio message from ' + data.name);
            body.append('_template', 'table');
            body.append('_captcha', 'false');
            body.append('sentAt', data.sentAt);

            return fetch('https://formsubmit.co/ajax/' + MAILBOX, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: body
            }).then(function (response) {
                return response.json().catch(function () {
                    return { success: false, message: 'Invalid mail response' };
                });
            });
        }

        function deliverNatively() {
            if (nextField) nextField.value = buildNextUrl();
            HTMLFormElement.prototype.submit.call(form);
        }

        dialogClose.addEventListener('click', hideMailDialog);
        dialog.addEventListener('click', function (event) {
            if (event.target === dialog) hideMailDialog();
        });

        const params = new URLSearchParams(location.search);
        if (params.get('mail') === 'sent') {
            showMailDialog(
                'success',
                'Message sent successfully',
                'Thank you. Your message has been delivered. I will get back to you soon.'
            );
            params.delete('mail');
            const clean = location.pathname + (params.toString() ? '?' + params.toString() : '') + '#contact';
            history.replaceState({}, '', clean);
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const name = document.getElementById('text').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const message = document.getElementById('message').value.trim();

            form.classList.remove('is-error', 'is-success');

            if (!name || !email || !phone || !message) {
                form.classList.add('is-error');
                showMailDialog('error', 'Missing details', 'Please fill in all fields before sending.');
                return;
            }

            if (!/^\S+@\S+\.\S+$/.test(email)) {
                form.classList.add('is-error');
                showMailDialog('error', 'Invalid email', 'Please enter a valid email address.');
                return;
            }

            if (!isValidPhone(phone)) {
                form.classList.add('is-error');
                showMailDialog('error', 'Invalid phone', 'Please enter a valid 10-digit phone number.');
                return;
            }

            if (location.protocol === 'file:') {
                form.classList.add('is-error');
                showMailDialog(
                    'info',
                    'Open with Live Server',
                    'Email sending does not work when the HTML file is opened directly. Right-click index.html, choose Open with Live Server, then send the message again.'
                );
                return;
            }

            const payload = {
                name: name,
                email: email,
                phone: phone,
                message: message,
                sentAt: new Date().toLocaleString()
            };

            button.classList.add('is-sending');
            button.disabled = true;

            sendViaFormSubmit(payload)
                .then(function (result) {
                    const ok = result && (result.success === true || result.success === 'true');
                    const messageText = String((result && result.message) || '');

                    if (ok) {
                        form.reset();
                        form.classList.add('is-success');
                        showMailDialog(
                            'success',
                            'Message sent successfully',
                            'Thank you, ' + name + '. Your message has been delivered to ' + MAILBOX + '. I will get back to you soon.'
                        );
                        return;
                    }

                    if (/activ/i.test(messageText) || /web server/i.test(messageText)) {
                        showMailDialog(
                            'info',
                            'Activate email delivery',
                            'Open Gmail for ' + MAILBOX + ' (check Spam too). Click the FormSubmit “Activate Form” link. Then come back here and press Send Message again. After that one click, this message will be delivered.'
                        );
                        return;
                    }

                    deliverNatively();
                })
                .catch(function () {
                    deliverNatively();
                })
                .finally(function () {
                    button.classList.remove('is-sending');
                    button.disabled = false;
                });
        });
    }

    updateAge();
    updateTimelineDates();
    updateStatusTitles();
    updateExperienceCounter();
    initCounters();
    initReveal();
    initActiveNav();
    initTyping();
    initScrollProgress();
    initContactForm();
})();

$(document).ready(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    $('#menu').click(function () {
        $(this).toggleClass('fa-bars fa-xmark');
        $('header').toggleClass('toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-xmark').addClass('fa-bars');
        $('header').removeClass('toggle');
        if ($(window).scrollTop() > 0) {
            $('.top').show();
        } else {
            $('.top').hide();
        }
    });

    $('a[href*="#"]').on('click', function (e) {
        const target = $($(this).attr('href'));
        if (!target.length) return;
        e.preventDefault();
        $('html, body').animate({
            scrollTop: target.offset().top
        }, prefersReducedMotion ? 0 : 500, 'linear');
    });
});
