FROM kong/kong-gateway:3.15.0.5

USER root
RUN mkdir -p /kong/declarative && chmod 755 /kong /kong/declarative
USER kong

# The config is public, and must be readable by the image's non-root user
# regardless of host filesystem permissions (including shared/NTFS mounts).
COPY --chmod=644 infrastructure/local/kong.yaml /kong/declarative/kong.yaml
