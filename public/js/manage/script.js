const contributorHMTL = async user => {
    let modal = $(`
    <div class="modal fade">
        <div class="modal-dialog">
            <div class="permissions-form">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title clmp">manage&nbsp;-&nbsp;</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="w-100 text-center">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success">
                            <i class="fa-solid fa-check me-2"></i>
                            <span>save changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `);

    let html = $(`
    <div class="contributor">
        <div class="modal-link d-flex align-items-center" data-bs-toggle="modal">
            <div class="profile-image me-2"></div>
            <div class="names d-flex flex-column">
                <div class="username clmp"></div>
                <small class="handle clmp d-flex">
                    <span class="user-select-none">@</span>
                    <span class="handle-text"></span>
                </small>
            </div>
        </a>
    </div>
    `);

    $(html).find(".modal-link").attr("data-bs-target", `#modal-${user.id}`);
    $(modal).attr("id", `modal-${user.id}`);
    $(modal).attr("data-user-id", user.id);
    $(modal).find(".modal-title").text(`manage\xa0-\xa0${user.displayName}`);

    $(html).find(".profile-image").css("background-image", `url(${CSS.escape(user.iconURL)}), url(/img/user-unavailable.svg)`);
    $(html).find(".username").text(user.displayName);
    $(html).find(".handle-text").text(user.handle);

    $("body").prepend(modal);
    
    const allPermissions = await $.ajax({
        url: "/api/project/permissions/names",
        type: "GET"
    });

    $(modal).find(".modal-body").empty();
    $(modal).find(".modal-body").prepend($("<div class='feedback-message'></div>"));
    allPermissions.filter(x => x != "ALL").forEach(x => {
        let check = $(`
        <div class="form-check">
            <input type="checkbox" class="form-check-input">
            <label class="form-check-label"></label>
        </div>
        `);
        $(check).find("input").attr("id", `check-${user.id}-${x}`);
        $(check).find("input").attr("name", x);
        $(check).find("input").attr("checked", user.permissions.includes(x));
        $(check).find("label").attr("for", `check-${user.id}-${x}`);
        $(check).find("label").text(x);
        
        $(modal).find(".modal-body").append(check);
    });

    $(modal).find(".btn-success").on("click", async e => {
        let allow = [];
        let forbid = [];
        $(modal).find(".permissions-form").find(".form-check").get().forEach(x => {
            let input = $(x).find("input[type='checkbox']");
            let label = $(x).find("label");
            
            let perm = $(label).text();
            if ($(input).is(":checked")) allow.push(perm);
            else forbid.push(perm);
        });

        let res = await $.ajax({
            url: `/api/project/${$(".project-id").text()}/permissions/${user.id}`,
            type: "POST",
            data: {
                allow: allow,
                forbid: forbid
            }
        });

        if (res && res.status == 200) {
            let msg = $(modal).find(".feedback-message");
            $(msg).css("color", "var(--bs-success)");
            $(msg).text("permissions set successfully.");
            setTimeout(() => location.reload(), 1000);
        } else {
            let msg = $(modal).find(".feedback-message");
            $(msg).css("color", "var(--bs-danger)");
            $(msg).text("unable to set permissions.");
        }
    });

    return html;
}

const commentHTML = async comment => {
    const user = await $.ajax({
        url: `/api/user/${comment?.userID}`,
        type: "GET"
    });

    let html = $(`
    <div class="comment d-flex position-relative">
        <div class="position-absolute w-100 h-100 d-flex justify-content-center align-items-center delete-overlay">
            <div class="delete-comment">
                <div class="d-flex align-items-center delete-comment-content">
                    <i class="fa-solid fa-dumpster-fire me-2"></i>
                    <div>click to delete</div>
                </div>
            </div>
        </div>
        <a class="user-link">
            <div class="profile-picture" style="url(/img/user-unavailable.svg)"></div>
        </a>
        <div class="comment-text ms-2">
            <div class="handle clmp d-flex">
                <span class="user-select-none">@</span>
                <span>
                    <a class="user-link user-handle"></a>
                </span>
                <span>・</span>
                <span>${moment(comment.timestamp).fromNow()}</span>
            </div>
            <div class="comment-content"></div>
        </div>
    </div>`);

    $(html).attr("data-comment-id", comment.id);
    $(html).find("a.user-link").prop("href", `/user/${user.id}`);
    $(html).find(".user-handle").text(user.handle);
    $(html).find(".delete-comment").on("click", async () => {
        $(`.comment[data-comment-id=${CSS.escape(comment.id)}] .delete-comment-content`).html(`<i class="fa-solid fa-spinner fa-spin"></i>`);

        let res = await $.ajax({
            url: `/api/comment/${comment.id}`,
            method: "DELETE"
        });

        if (res.status == 200) {
            $(`.comment-delete-message`).css("color", "var(--bs-success)");
            $(`.comment-delete-message`).text("deleted comment successfully.");
            $(`.comment[data-comment-id=${CSS.escape(comment.id)}]`).remove();
        } else {
            $(`.comment-delete-message`).css("color", "var(--bs-danger)");
            $(`.comment-delete-message`).text("couldn't delete comment.");
        }
    });
    $(html).find(".profile-picture").css("background-image", `url(${CSS.escape(user.iconURL)}), url(/img/user-unavailable.svg)`);
    
    if (comment.content) $(html).find(".comment-content").text(comment.content);
    else {
        $(html).find(".comment-content").css("opacity", 0.6);
        $(html).find(".comment-content").text("- empty comment -");
    }

    return html;
}

const userSearchResult = user => {
    let html = $(`
    <div class="contributor">
        <div class="d-flex align-items-center">
            <div class="profile-image me-2"></div>
            <div class="names d-flex flex-column">
                <div class="username clmp"></div>
                <small class="handle clmp d-flex">
                    <span class="user-select-none">@</span>
                    <span class="handle-text"></span>
                </small>
            </div>
        </a>
    </div>
    `);

    $(html).find(".profile-image").css("background-image", `url(${CSS.escape(user.iconURL)}), url(/img/user-unavailable.svg)`);
    $(html).find(".username").text(user.displayName);
    $(html).find(".handle-text").text(user.handle);

    return html;
}

const releaseHTML = release => {
    let html = $(`
    <div class="release">
        <a class="w-100 release-link">
            <div class="d-flex justify-content-between">
                <div class="d-flex flex-column me-2">
                    <h5 class="version-name mb-0 clmp"></h5>
                    <small class="release-date"></small>
                </div>
            </div>
        </a>
    </div>
    `);

    $(html).find(".release-link").attr("href", `/manage/${$(".project-id").text()}/release/${release.timestamp}`);
    $(html).find(".version-name").text(release.version || "new version");
    $(html).find(".release-date").text(new Date(release.timestamp || 0).toLocaleDateString("en-gb", { year: "numeric", month: "numeric", day: "numeric" }));

    return html;
}

$("document").ready(() => {
    const projectID = $(".project-id").text();
    $.ajax({
        url: `/api/project/${projectID}/contributors`,
        type: "GET",
        success: async res => {
            if (!res || !res.length) {
                return $(".contributors").html("no contributors.");
            }

            let cleared = false;
            for (let i = 0; i < res.length; i++) {
                let contributorThing = await contributorHMTL(res[i]);
                if (!cleared) {
                    cleared = true;
                    $(".contributors").empty();

                    let search = $(`
                    <div class="handle-search mb-3 position-relative">
                        <div class="input-group">
                            <span class="input-group-text">@</span>
                            <input type="text" class="handle-search form-control" placeholder="search for a user to add" type="text">
                        </div>
                        <div class="position-absolute w-100 handle-search-results d-none"></div>
                    </div>
                    `);

                    let results = $(search).find(".handle-search-results");
                    let input = $(search).find("input");

                    $(search).on("input", _.debounce(async e => {
                        if (!input.val() && !results.hasClass("d-none")) {
                            results.empty();
                            return results.text("no results.");
                        }

                        let spinner = $(`
                        <div class="w-100 text-center">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </div>
                        `);

                        results.empty();
                        results.prepend(spinner);

                        results.removeClass("d-none");
                        $(search).find(".input-group-text").css("border-bottom-left-radius", 0);
                        input.css("border-bottom-right-radius", 0);

                        let users = await $.ajax({
                            url: `/api/user/search/${encodeURIComponent("%")}${encodeURIComponent(input.val())}${encodeURIComponent("%")}`,
                            type: "GET"
                        });

                        users &&= users.filter(x => !res.map(y => y.id).includes(x.id));
                        
                        if (!users || !users.length) {
                            results.empty();
                            return results.text("no results.");
                        }

                        results.empty();
                        for (let i = 0; i < users.length; i++) {
                            let thing = userSearchResult(users[i]);

                            $(thing).on("click", async e => {
                                await $.ajax({
                                    url: `/api/project/${projectID}/permissions/${users[i].id}`,
                                    type: "POST",
                                    data: {
                                        allow: [
                                            "CONTRIBUTOR"
                                        ]
                                    }
                                });

                                location.reload();
                            });

                            results.append(thing);
                        }

                    }, 500));

                    $(search).on("focusin", e => {
                        if (input.val()) {
                            results.removeClass("d-none");
                            $(search).find(".input-group-text").css("border-bottom-left-radius", 0);
                            input.css("border-bottom-right-radius", 0);
                        }
                    });

                    let off = e => {
                        if (results.hasClass("d-none")) return;
                        if (!$(search).is(":hover")) {
                            results.addClass("d-none");
                            $(search).find(".input-group-text").css("border-bottom-left-radius", "0.375rem");
                            input.css("border-bottom-right-radius", "0.375rem");
                        }
                    }

                    $(search).on("focusout", off);
                    $(document).on("click", off);

                    $(".contributors").prepend(search);
                }
                $(".contributors").append(contributorThing);
            }
        }
    });

    $.ajax({
        url: `/api/project/${projectID}/comments`,
        type: "GET",
        success: async res => {
            if (!res || !res.length) {
                return $(".comments").html("no comments.")
            }

            let cleared = false;
            for (let i = 0; i < res.length; i++) {
                let commentThing = await commentHTML(res[i]);
                if (!cleared) {
                    cleared = true;
                    $(".comments").empty();
                }
                $(".comments").append(commentThing);
            }
        }
    });

    $.ajax({
        url: `/api/project/${projectID}/release/all?includeUnpublished=true`,
        type: "GET",
        success: async res => {
            $(".releases").empty();

            if (canCreate) {
                let button = $(`
                <button class="new-release btn btn-primary mb-2">
                    <i class="fa-solid fa-plus" style="margin-right: 5px"></i>
                    <span>new release</span>
                </button>
                `)

                $(button).on("click", async e => {
                    let res2 = await $.ajax({
                        url: `/api/project/${projectID}/release/new`,
                        type: "POST"
                    });

                    if (res2.status == 200) {
                        window.location.href = `/manage/${projectID}/release/${res2.releaseTimestamp}`;
                    }
                })

                $(".releases").append(button);
            }

            res.forEach(x => {
                $(".releases").append(releaseHTML(x));
            })
        }
    });

    if ($(".delete-project")) {
        $(".delete-project").on("click", async e => {
            try {
                let response = await $.ajax({
                    url: `/api/project/${projectID}`,
                    type: "DELETE"
                });

                if (response.status == 200) {
                    window.location.replace("/");
                }
            } catch (e) {
                $("body").html("pain");
            }
        });
    }
});